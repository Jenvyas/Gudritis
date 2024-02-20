use anyhow::{Context, Result};
use axum::{
    extract::{
        ws::{Message, WebSocket},
        Query, Request, State, WebSocketUpgrade,
    },
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::get,
    Extension, Router,
};
use axum_extra::{headers, TypedHeader};
use futures_util::{sink::SinkExt, stream::StreamExt};
use gudritis_axum::{
    actors::{GameActorHandle, GameManagerActorHandle},
    game::{Command, Player},
};
use mongodb::{
    options::{ClientOptions, ServerApi, ServerApiVersion},
    Client as MongoDBClient, Database,
};
use redis::{self, Client as RedisClient, Commands};
use serde::Deserialize;
use std::{env, time::Instant};
use tokio::sync::mpsc;

#[derive(Clone)]
struct AppState {
    game_manager: GameManagerActorHandle,
    redis_client: RedisClient,
}

#[derive(Clone)]
struct PlayerWithGameHandle {
    player: Player,
    game_handle: GameActorHandle,
}

#[derive(Deserialize)]
struct JoinQuery {
    code: usize,
    nickname: String,
}

#[tokio::main]
async fn main() {
    let db_addr = env::args()
        .nth(2)
        .unwrap_or_else(|| "mongodb://localhost:27017".to_string());
    let redis_addr = env::args()
        .nth(3)
        .unwrap_or_else(|| "redis://127.0.0.1/".to_string());
    let database = connect_db(db_addr).await.unwrap();
    let redis_client = redis::Client::open(redis_addr).unwrap();
    let game_manager = GameManagerActorHandle::new(database).await;

    // App global state, used by the join_game middleware
    let state = AppState {
        game_manager,
        redis_client,
    };

    let app = Router::new()
        .route("/ws", get(websocket_handler))
        .layer(middleware::from_fn_with_state(state.clone(), join_game));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// Connects to and returns a `Result` that contains a MongoDB database connection .
pub async fn connect_db(db_addr: String) -> Result<Database, mongodb::error::Error> {
    let mut client_options = ClientOptions::parse(db_addr).await?;

    let server_api = ServerApi::builder().version(ServerApiVersion::V1).build(); //MongoDb Client
    client_options.server_api = Some(server_api);

    let client = MongoDBClient::with_options(client_options)?;

    let game_db = client.database("Gudritis");
    Ok(game_db)
}

/// Middleware for extracting game join parameters and session cookie and attempting to connect to the game.
///
/// Extends the request with a `PlayerWithGameHandle` if successful, otherwise returns appropriate `Response`.
async fn join_game(
    State(mut state): State<AppState>,
    Query(join_query): Query<JoinQuery>,
    TypedHeader(cookies): TypedHeader<headers::Cookie>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Gets the session cookie from the Cookie extractor
    let session_cookie = match cookies.get("session") {
        Some(cookie) => cookie,
        None => return Ok((StatusCode::BAD_REQUEST, "No session cookie").into_response()),
    };

    // 
    let player_id = state
        .redis_client
        .get(session_cookie)
        .context("failed to retrieve session from redis")?;
    let player = Player::new(player_id, join_query.nickname, None);
    let game_handle = match state
        .game_manager
        .join_game(player.clone(), join_query.code as u32)
        .await
    {
        Some(game_handle) => game_handle,
        None => return Ok((StatusCode::NOT_FOUND, "No game with that code").into_response()),
    };
    let player_with_game: PlayerWithGameHandle = PlayerWithGameHandle {
        player,
        game_handle,
    };

    request.extensions_mut().insert(player_with_game);
    let response = next.run(request).await;
    Ok(response)
}

/// Attempts to upgrade the connection to websocket.
async fn websocket_handler(
    ws: WebSocketUpgrade,
    Extension(player_with_game): Extension<PlayerWithGameHandle>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| websocket(socket, player_with_game))
}

/// Handles the websocket connection and all valid messages sent by the player.
///
/// Closes the connection in case an invalid message is sent, the player leaves the game or sends a Close message.
async fn websocket(socket: WebSocket, player_with_game: PlayerWithGameHandle) {
    let (game, mut player) = (player_with_game.game_handle, player_with_game.player);
    let (mut sender, mut receiver) = socket.split();

    let (tx, mut rx) = mpsc::channel(8);
    player.new_connection(tx);
    game.join_game(player.clone()).await;

    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            let player_id = player.get_id();
            match msg {
                Message::Text(msg) => {
                    let json = match serde_json::from_str(&msg) {
                        Ok(json) => json,
                        Err(_) => break,
                    };
                    let command = match Command::from_json(json) {
                        Ok(command) => command,
                        Err(_) => break,
                    };
                    match command {
                        Command::Start => {
                            game.start_game(player_id.to_string()).await;
                        }
                        Command::Answer {
                            answer,
                            slide_index,
                        } => {
                            let answer_submit_time = Instant::now();
                            game.submit_answer(
                                slide_index,
                                answer,
                                answer_submit_time,
                                player_id.to_string(),
                            )
                            .await;
                        }
                        Command::Leave => {
                            game.leave(player_id.to_string()).await;
                            break;
                        }
                        Command::End => {
                            game.end(player_id.to_string()).await;
                        }
                        Command::Kick {
                            player_id: kick_player_id,
                        } => {
                            game.kick(kick_player_id, player_id.to_string()).await;
                        }
                        _ => {}
                    }
                }
                Message::Close(_) => {
                    game.leave(player_id.to_string()).await;
                    break;
                }
                _ => {
                    break;
                }
            }
        }
    });

    tokio::select! {
        _ = (&mut recv_task) => send_task.abort(),
        _ = (&mut send_task) => recv_task.abort(),

    }
}

/// For loggings server side errors with [tracing] and sending the user a `500 Internal Server Error` response.
#[derive(Debug)]
struct AppError(anyhow::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::error!("Application error: {:#}", self.0);

        (StatusCode::INTERNAL_SERVER_ERROR, "Something went wrong").into_response()
    }
}

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use std::{
//         future::IntoFuture,
//         net::{Ipv4Addr, SocketAddr},
//     };
//     use tokio_tungstenite::tungstenite;

//     #[tokio::test]
//     async fn integration_test() {
//         let listener = tokio::net::TcpListener::bind(SocketAddr::from((Ipv4Addr::UNSPECIFIED, 0)))
//             .await
//             .unwrap();
//         let addr = listener.local_addr().unwrap();

//         let app = Router::new()
//             .route("/ws", get(websocket_handler))
//             .layer(middleware::from_fn_with_state(state.clone(), join_game));

//         tokio::spawn(axum::serve(listener, app).into_future());

//         assert_eq!("", "");
//     }
// }
