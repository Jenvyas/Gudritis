use crate::game::{GameSession, Player, StoredGameSession};
use mongodb::{bson::doc, Database};
use std::{collections::HashMap, time::Instant};
use tokio::sync::{mpsc, oneshot};

enum LobbyMessage {
    Host {
        session_id: String,
    },
    Join {
        game_code: u32,
        player: Player,
        respond_to: oneshot::Sender<Option<GameActorHandle>>,
    },
}

enum GameMessage {
    Join {
        player: Player,
    },
    Start {
        player_id: String,
    },
    Answer {
        player_id: String,
        answer: Vec<usize>,
        answer_time: Instant,
        slide_index: usize,
    },
    Leave {
        player_id: String,
    },
    Kick {
        kick_player_id: String,
        player_id: String,
    },
    End {
        player_id: String,
    },
}

#[derive(Clone)]
pub struct GameManagerActorHandle {
    sender: mpsc::Sender<LobbyMessage>,
}

impl GameManagerActorHandle {
    pub async fn new(db: Database) -> Self {
        let (sender, receiver) = mpsc::channel(32);

        let actor = GameManagerActor::new(receiver, db);

        tokio::spawn(run_game_manager_actor(actor));

        Self { sender }
    }

    pub async fn host_game(&mut self, session_id: String) {
        println!("Hosting game with id:{session_id}");
        let msg = LobbyMessage::Host { session_id };
        let _ = self.sender.send(msg).await;
    }

    pub async fn join_game(&mut self, player: Player, game_code: u32) -> Option<GameActorHandle> {
        let (send, recv) = oneshot::channel();
        let msg = LobbyMessage::Join {
            player,
            game_code,
            respond_to: send,
        };

        let _ = self.sender.send(msg).await;
        recv.await.expect("Actor task has been killed")
    }
}

async fn run_game_actor(mut actor: GameActor) {
    while let Some(msg) = actor.receiver.recv().await {
        actor.handle_message(msg).await;
    }
}

struct GameManagerActor {
    receiver: mpsc::Receiver<LobbyMessage>,
    games: HashMap<u32, GameActorHandle>,
    db: Database,
}

impl GameManagerActor {
    fn new(receiver: mpsc::Receiver<LobbyMessage>, db: Database) -> Self {
        Self {
            receiver,
            games: HashMap::new(),
            db,
        }
    }

    async fn handle_message(&mut self, msg: LobbyMessage) {
        match msg {
            LobbyMessage::Host { session_id } => {
                let stored_session = self
                    .db
                    .collection::<StoredGameSession>("gameSessions")
                    .find_one(doc! {"_id": session_id}, None)
                    .await
                    .unwrap()
                    .unwrap();
                let session = GameSession::from_stored(stored_session);

                let code = session.get_code();
                let handle = GameActorHandle::new(session);
                self.games.insert(code, handle);
            }
            LobbyMessage::Join {
                player,
                game_code,
                respond_to,
            } => {
                let game = self.games.get_mut(&game_code);
                match game {
                    Some(game) => {
                        game.join_game(player).await;
                        let _ = respond_to.send(Some(game.clone()));
                    }
                    None => {
                        let _ = respond_to.send(None);
                    }
                }
            }
        }
    }
}

async fn run_game_manager_actor(mut actor: GameManagerActor) {
    while let Some(msg) = actor.receiver.recv().await {
        actor.handle_message(msg).await;
    }
}

#[derive(Clone)]
pub struct GameActorHandle {
    sender: mpsc::Sender<GameMessage>,
}

impl GameActorHandle {
    pub fn new(session: GameSession) -> Self {
        let (sender, receiver) = mpsc::channel(8);
        let actor = GameActor::new(receiver, session);
        tokio::spawn(run_game_actor(actor));

        Self { sender }
    }

    pub async fn start_game(&self, player_id: String) {
        let msg = GameMessage::Start { player_id };
        self.sender
            .send(msg)
            .await
            .expect("Actor task has been killed");
    }

    pub async fn join_game(&self, player: Player) {
        let msg = GameMessage::Join { player };
        self.sender
            .send(msg)
            .await
            .expect("Actor task has been killed");
    }

    pub async fn submit_answer(
        &self,
        slide_index: usize,
        answer: Vec<usize>,
        answer_time: Instant,
        player_id: String,
    ) {
        let msg = GameMessage::Answer {
            player_id,
            answer,
            answer_time,
            slide_index,
        };
        self.sender
            .send(msg)
            .await
            .expect("Actor task has been killed");
    }

    pub async fn leave(&self, player_id: String) {
        let msg = GameMessage::Leave { player_id };
        self.sender
            .send(msg)
            .await
            .expect("Actor task hs been killed");
    }

    pub async fn kick(&self, kick_player_id: String, player_id: String) {
        let msg = GameMessage::Kick { kick_player_id, player_id };
        self.sender
            .send(msg)
            .await
            .expect("Actor task has been killed");
    }

    pub async fn end(&self, player_id: String) {
        let msg = GameMessage::End { player_id };
        self.sender
            .send(msg)
            .await
            .expect("Actor task has been killed");
    }
}

struct GameActor {
    receiver: mpsc::Receiver<GameMessage>,
    session: GameSession,
}

impl GameActor {
    fn new(receiver: mpsc::Receiver<GameMessage>, session: GameSession) -> Self {
        Self { receiver, session }
    }

    async fn handle_message(&mut self, msg: GameMessage) {
        match msg {
            GameMessage::Join { player } => {
                self.session.join(player).await;
            }
            GameMessage::Start { player_id } => {
                self.session.start(player_id).await;
            }
            GameMessage::Answer {
                player_id,
                answer,
                answer_time,
                slide_index,
            } => {
                self.session
                    .answer(player_id, answer, answer_time, slide_index)
                    .await;
            }
            GameMessage::Leave { player_id } => {
                self.session.leave(player_id).await;
            }
            GameMessage::Kick { kick_player_id, player_id } => {
                self.session.kick(kick_player_id, player_id).await;
            }
            GameMessage::End { player_id } => {
                self.session.host_end(player_id).await;
            }
        }
    }
}
