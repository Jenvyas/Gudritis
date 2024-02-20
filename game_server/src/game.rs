use std::{collections::HashMap, time::Instant, vec};

use axum::extract::ws::Message;

use rand::seq::SliceRandom;
use rand::thread_rng;

use mongodb::bson::DateTime;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::sync::mpsc::Sender;

type Tx = Sender<Message>;

#[derive(Clone, Debug)]
pub struct Player {
    player_id: String,
    nickname: String,
    connection: Option<Tx>,
}

impl Player {
    pub fn new(player_id: String, nickname: String, tx: Option<Tx>) -> Self {
        Player {
            player_id,
            nickname,
            connection: tx,
        }
    }

    /// Replaces the players `Sender` with a new one
    pub fn new_connection(&mut self, tx: Sender<Message>) {
        self.connection = Some(tx);
    }

    /// Sends a simple text message to the player.
    pub async fn send_text_message(&mut self, text_message: &str) {
        if let Some(connection) = &self.connection {
            let _ = connection.send(text_message.into()).await;
        }
    }

    /// Sends a `PlayerMessage` to the player by serializing it into text.
    async fn send_message(&mut self, message: PlayerMessage) {
        if let Some(tx) = &self.connection {
            let serialized_message = serde_json::to_string(&message).unwrap();
            let _ = tx.send(Message::Text(serialized_message)).await;
        }
    }

    pub fn get_id(&self) -> &str {
        &self.player_id
    }

    pub fn get_nickname(&self) -> &str {
        &self.nickname
    }
}

/// The `SlideStack` type. Meant for creating and keeping track of a shuffled stack of slide indexes to send the player. 
struct SlideStack {
    slide_stack: Vec<usize>,
    current_slide: Option<CurrentSlide>,
    answered_slides: Vec<usize>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct CurrentSlide {
    starting_time: Instant,
    index: usize,
}

impl SlideStack {
    /// Creates a new `SlideStack` of a given size.
    fn new(size: usize) -> Self {
        let mut slide_stack: Vec<usize> = (0..size).collect();
        slide_stack.shuffle(&mut thread_rng());
        let current_slide = None;
        Self {
            slide_stack,
            current_slide,
            answered_slides: Vec::with_capacity(size),
        }
    }

    /// Progresses the slides by one returning the next one. Sets current_slide to the new slide.
    fn next_slide(&mut self) -> Option<usize> {
        let next = self.slide_stack.pop();
        if let Some(current_slide) = &self.current_slide {
            self.answered_slides.push(current_slide.index);
        }
        self.current_slide = None;
        if let Some(index) = next {
            self.current_slide = Some(CurrentSlide {
                starting_time: Instant::now(),
                index,
            });
        }
        next
    }

    /// Returns the current slide.
    fn current_slide(&self) -> Option<CurrentSlide> {
        self.current_slide
    }
}

pub struct GameSession {
    //stage: GameStage,
    code: u32,
    active: bool,
    host: Player,
    players: HashMap<String, SessionPlayer>,
    template: GameTemplate,
}

#[derive(Debug, PartialEq)]
enum PlayerStatus {
    Connected,
    Disconnected,
    Finished,
}

pub struct SessionPlayer {
    player: Player,
    status: PlayerStatus,
    answers: Vec<PlayerAnswer>,
    slide_stack: SlideStack,
}

impl GameSession {
    pub fn from_stored(stored_session: StoredGameSession) -> Self {
        let host = Player {
            player_id: stored_session.host,
            nickname: String::from("Host"),
            connection: None,
        };

        let stored_template = stored_session.template;
        let template = GameTemplate {
            name: stored_template.name,
            slides: stored_template.slides,
            author: stored_template.author,
            author_id: stored_template.author_id,
        };

        GameSession {
            //stage: GameStage::Lobby,
            code: stored_session.code,
            active: true,
            host,
            players: HashMap::new(),
            template,
        }
    }

    pub async fn start(&mut self, player_id: String) {
        if player_id != self.host.player_id {
            self.send_to(
                PlayerMessage::Error {
                    err: "Not the host".to_string(),
                },
                &player_id,
            )
            .await;
            return;
        }
        for session_player in self.players.values_mut() {
            let slide_index = session_player.slide_stack.next_slide();
            if let Some(slide_index) = slide_index {
                session_player
                    .player
                    .send_message(PlayerMessage::Slide {
                        slide: self.template.get_slide(slide_index),
                    })
                    .await;
            } else {
                todo!("add player stack end handling");
            }
        }
    }

    pub async fn join(&mut self, mut player: Player) {
        let player_id = player.get_id().to_string();
        let nickname = player.get_nickname().to_string();
        if player.player_id == self.host.player_id {
            player.send_text_message("hostJoin").await;
            self.host = player;
        } else if let Some(session_player) = self.players.get_mut(&player.player_id) {
            session_player.player.connection = player.connection;
            session_player.player.nickname = player.nickname;
            session_player.status = PlayerStatus::Connected;
        } else {
            self.players.insert(
                player.get_id().to_string(),
                SessionPlayer {
                    player,
                    status: PlayerStatus::Disconnected,
                    answers: Vec::new(),
                    slide_stack: SlideStack::new(self.template.get_slide_count()),
                },
            );
        }
        let mut player_names: Vec<String> = vec![];
        for session_player in self.players.values() {
            player_names.push(session_player.player.nickname.clone());
        }
        self.send_to(PlayerMessage::Players { player_names }, &player_id)
            .await;
        self.emit(
            PlayerMessage::PlayerJoin {
                player_name: nickname.to_string(),
            },
            player_id,
        )
        .await;
    }

    pub async fn answer(
        &mut self,
        player_id: String,
        answer: Vec<usize>,
        answer_time: Instant,
        slide_index: usize,
    ) {
        let session_player = self.players.get_mut(&player_id).unwrap();
        match session_player.status {
            PlayerStatus::Connected => {
                let current_slide = session_player.slide_stack.current_slide();
                match current_slide {
                    Some(current_slide) => {
                        if slide_index != current_slide.index {
                            self.send_to(
                                PlayerMessage::Error {
                                    err: "Incorrect slide index".to_string(),
                                },
                                &player_id,
                            )
                            .await;
                            return;
                        }
                        let slide = &self.template.slides[current_slide.index];
                        let elapsed_time = answer_time - current_slide.starting_time;
                        if elapsed_time.as_secs() >= slide.duration as u64 {
                            self.send_to(
                                PlayerMessage::Error {
                                    err: "Time ran out".to_string(),
                                },
                                &player_id,
                            )
                            .await;
                            return;
                        }
                        let mut correct = true;
                        let correct_answers = slide.correct_answer.clone();
                        for correct_answer in &correct_answers {
                            match answer
                                .iter()
                                .find(|player_answer| **player_answer == *correct_answer)
                            {
                                None => {
                                    correct = false;
                                    break;
                                }
                                _ => {}
                            }
                        }
                        session_player.answers.push(PlayerAnswer {
                            player_id: player_id.clone(),
                            slide_index,
                            slide_start_time: current_slide.starting_time,
                            answer,
                            answer_submit_time: answer_time,
                        });
                        self.send_to(
                            PlayerMessage::AnswerResult {
                                correct,
                                correct_answers,
                            },
                            &player_id,
                        )
                        .await;
                    }
                    None => {
                        self.send_to(
                            PlayerMessage::Error {
                                err: "No current active slide".to_string(),
                            },
                            &player_id,
                        )
                        .await;
                    }
                }
            }
            PlayerStatus::Finished => {
                self.send_to(
                    PlayerMessage::Error {
                        err: "Player has already finished".to_string(),
                    },
                    &player_id,
                )
                .await;
            }
            PlayerStatus::Disconnected => {}
        }
    }

    pub async fn next_slide(&mut self, player_id: String) {
        let session_player = self.players.get_mut(&player_id).unwrap();
        match session_player.status {
            PlayerStatus::Connected => {
                let slide_index = session_player.slide_stack.next_slide();
                if let Some(slide_index) = slide_index {
                    session_player
                        .player
                        .send_message(PlayerMessage::Slide {
                            slide: self.template.get_slide(slide_index),
                        })
                        .await;
                } else {
                    session_player.status = PlayerStatus::Finished;
                    session_player
                        .player
                        .send_message(PlayerMessage::Finish)
                        .await;
                }
            }
            PlayerStatus::Finished => {
                self.send_to(
                    PlayerMessage::Error {
                        err: "Player has already finished".to_string(),
                    },
                    &player_id,
                )
                .await;
            }
            PlayerStatus::Disconnected => {}
        }
    }

    pub async fn leave(&mut self, player_id: String) {
        let session_player = self.players.get_mut(&player_id).unwrap();
        session_player.status = PlayerStatus::Disconnected;
        session_player.player.connection = None;
    }

    /// Kick a player from the game session
    pub async fn kick(&mut self, kick_player_id: String, player_id: String) {
        if player_id != self.host.player_id {
            self.send_to(
                PlayerMessage::Error {
                    err: "Not the host".to_string(),
                },
                &player_id,
            )
            .await;
            return;
        }
        let _ = self.players.remove(&kick_player_id);
    }

    /// End the game session if player is host.
    pub async fn host_end(&mut self, player_id: String) {
        if player_id != self.host.player_id {
            self.send_to(
                PlayerMessage::Error {
                    err: "Not the host".to_string(),
                },
                &player_id,
            )
            .await;
            return;
        }
        self.end().await;
    }

    /// End the game session.
    pub async fn end(&mut self) {
        todo!("Add end game handling")
    }

    /// Send a message to a specific player.
    async fn send_to(&mut self, message: PlayerMessage, player_id: &str) {
        if player_id == self.host.player_id {
            self.host.send_message(message).await;
            return;
        }
        let session_player = self.players.get_mut(player_id).unwrap();

        session_player.player.send_message(message).await;
    }

    /// Emits a message to all participants except for one specified with player_id
    async fn emit(&mut self, message: PlayerMessage, player_id: String) {
        let serialized_message = serde_json::to_string(&message).unwrap();
        if let Some(tx) = &self.host.connection {
            println!("sent to host");
            let _ = tx.send(Message::Text(serialized_message.clone())).await;
        }
        for (player_id_key, session_player) in &self.players {
            if player_id == *player_id_key {
                continue;
            }
            if let Some(tx) = &session_player.player.connection {
                let _ = tx.send(Message::Text(serialized_message.clone())).await;
            }
        }
    }

    /// Broadcasts a message to all participants
    async fn broadcast(&mut self, message: PlayerMessage) {
        let serialized_message = serde_json::to_string(&message).unwrap();
        for session_player in self.players.values() {
            if let Some(tx) = &session_player.player.connection {
                let _ = tx.send(Message::Text(serialized_message.clone())).await;
            }
        }
    }

    pub fn get_code(&self) -> u32 {
        self.code
    }
}

pub enum GameStage {
    Lobby,
    Game,
    End,
}

pub struct PlayerAnswer {
    player_id: String,
    slide_index: usize,
    slide_start_time: Instant,
    answer: Vec<usize>,
    answer_submit_time: Instant,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GameTemplate {
    name: String,
    slides: Vec<Slide>,
    author: String,
    author_id: String,
}

impl GameTemplate {
    pub fn get_slide_ref(&self, index: usize) -> &Slide {
        &self.slides[index]
    }
    pub fn get_slide(&self, index: usize) -> Slide {
        self.slides[index].clone()
    }
    pub fn get_slide_count(&self) -> usize {
        self.slides.len()
    }
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
pub struct Slide {
    duration: u8,
    text: Option<String>,
    image: Option<String>,
    is_multiple_answer: bool,
    answers: Vec<Answer>,
    correct_answer: Vec<usize>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct StoredGameSession {
    _id: String,
    code: u32,
    active: bool,
    host: String,
    players: Vec<StoredPlayer>,
    template: StoredGameTemplate,
    player_answers: Vec<StoredPlayerAnswers>,
}

#[derive(Debug, Deserialize, Serialize)]
struct StoredGameTemplate {
    _id: String,
    name: String,
    tags: Vec<String>,
    slides: Vec<Slide>,
    author: String,
    author_id: String,
    flagged: bool,
    created: DateTime,
    last_updated: DateTime,
    public: bool,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
struct Answer {
    index: usize,
    text: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct StoredPlayer {
    registered_player: bool,
    player_id: String,
    nickname: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct StoredPlayerAnswers {
    question_index: u32,
    answers: Vec<u32>,
    time: u32,
}

#[derive(Deserialize)]
#[serde(tag = "method")]
pub enum Command {
    Host {
        session_id: String,
    },
    Start,
    Join {
        user_id: String,
        nickname: String,
        registered_player: bool,
        game_code: u32,
    },
    Answer {
        answer: Vec<usize>,
        slide_index: usize,
    },
    End,
    Leave,
    Kick {
        player_id: String,
    },
}

impl Command {
    pub fn from_json(message: Value) -> Result<Self, serde_json::Error> {
        //parsing a message enum from a json ws message
        serde_json::from_value(message)
    }
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
#[serde(tag = "method")]
pub enum PlayerMessage {
    ///Serialized string containing the slide in json format
    Slide {
        slide: Slide,
    },
    AnswerResult {
        correct: bool,
        correct_answers: Vec<usize>,
    },
    Error {
        err: String,
    },
    Players {
        player_names: Vec<String>,
    },
    PlayerJoin {
        player_name: String,
    },
    Finish,
}

#[cfg(test)]
mod tests {
    use tokio::sync::mpsc;

    use super::*;

    //SlideStack tests
    #[test]
    fn empty_slide_stack() {
        let mut slide_stack = SlideStack::new(0);
        let slide = slide_stack.current_slide();
        assert_eq!(None, slide);
        let next_slide = slide_stack.next_slide();
        assert_eq!(None, next_slide);
        let slide = slide_stack.current_slide();
        assert_eq!(None, slide);
    }

    #[test]
    fn slide_stack() {
        let mut slide_stack = SlideStack::new(12);
        let slide = slide_stack.current_slide();
        assert_eq!(None, slide);
        let mut vec: Vec<usize> = (0..12).collect();
        for _ in 0..12 {
            let slide = slide_stack.next_slide().unwrap();
            let i = vec.iter().position(|num| *num == slide).unwrap();
            vec.remove(i);
            assert_eq!(slide, slide_stack.current_slide().unwrap().index);
        }
        assert_eq!(None, slide_stack.next_slide());
        assert_eq!(None, slide_stack.current_slide());
    }

    #[test]
    fn game_send_to() {}

    #[test]
    fn game_emit() {}

    #[test]
    fn game_broadcast() {}

    #[tokio::test]
    async fn game_join() {
        let mut session = GameSession::from_stored(StoredGameSession {
            _id: "".to_string(),
            code: 012345,
            active: true,
            host: "1".to_string(),
            players: vec![],
            template: StoredGameTemplate {
                _id: "".to_string(),
                name: "".to_string(),
                tags: vec![],
                slides: vec![],
                author: "".to_string(),
                author_id: "".to_string(),
                flagged: false,
                created: DateTime::now(),
                last_updated: DateTime::now(),
                public: true,
            },
            player_answers: vec![],
        });
        // Tests that the player list is indeed empty in the beginning
        assert_eq!(0, session.players.keys().len());
        let mut player = Player::new("player1".to_string(), "player1".to_string(), None);
        
        // Initial player join without the connection part
        session.join(player.clone()).await;
        assert_eq!(1, session.players.keys().len());

        let session_player = session.players.get("player1").unwrap();
        let game_player = &session_player.player;
        assert_eq!(PlayerStatus::Disconnected, session_player.status);
        assert!(game_player.connection.is_none());
        assert_eq!(player.nickname, game_player.nickname);
        assert_eq!(player.player_id, game_player.player_id);

        // Player has connection and is updated ingame with the connection
        let (tx, mut rx) = mpsc::channel(8);
        // Player receives one message which should be PlayerMessage::Players with all the players in the session  
        let receive_players = tokio::task::spawn(async move {
            let msg: Message = rx.recv().await.unwrap();
            assert!(matches!(Message::Text, msg));
            let text = msg.to_text().unwrap();
            let player_message = serde_json::from_value(serde_json::from_str(text).unwrap()).unwrap();
            assert_eq!(PlayerMessage::Players { player_names: vec!["player1".to_string()] }, player_message);
        });
        player.new_connection(tx);

        // Number of players in game should still be 1
        session.join(player.clone()).await;
        assert_eq!(1, session.players.keys().len());

        let session_player = session.players.get("player1").unwrap();
        let game_player = &session_player.player;
        assert_eq!(PlayerStatus::Connected, session_player.status);
        assert!(game_player.connection.is_some());
        assert_eq!(player.nickname, game_player.nickname);
        assert_eq!(player.player_id, game_player.player_id);
        receive_players.await.unwrap();
    }

    const TEST_TEMPLATE: &str = r#"{
        "_id": "88109899-b13b-40a4-8fc4-e1d9986ade13",
    "name": "Test",
    "tags": [],
    "slides": [
      {
        "duration": 10,
        "text": "Test question 1\n",
        "is_multiple_answer": false,
        "answers": [
          {
            "index": 0,
            "text": "Test answer 1"
          },
          {
            "index": 1,
            "text": "Test answer 2"
          }
        ],
        "correct_answer": [
          0
        ]
      },
      {
        "duration": 10,
        "text": "Test question 2\n",
        "is_multiple_answer": true,
        "answers": [
          {
            "index": 0,
            "text": "Test answer 1"
          },
          {
            "index": 1,
            "text": "Test answer 2"
          },
          {
            "index": 2,
            "text": "Test answer 3"
          },
          {
            "index": 3,
            "text": "Test answer 4"
          }
        ],
        "correct_answer": [
          0,
          3
        ]
      },
      {
        "duration": 10,
        "text": "Test question 3",
        "is_multiple_answer": false,
        "answers": [
          {
            "index": 0,
            "text": "Test answer 1"
          },
          {
            "index": 1,
            "text": "Test answer 2"
          }
        ],
        "correct_answer": [
          1
        ]
      }
    ],
    "author": "Jenvy",
    "author_id": "6fe6bc9d-89f5-4993-b2e8-8e18a7fc9037",
    "flagged": false,
    "created": {
      "$date": "2024-02-17T00:47:43.992Z"
    },
    "last_updated": {
      "$date": "2024-02-17T00:47:43.992Z"
    },
    "public": false
  }"#;
}
