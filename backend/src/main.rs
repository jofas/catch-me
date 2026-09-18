use axum::extract::{Json, Path, State};
use axum::routing::{get, post};
use rmpv::Value;
use serde::{Deserialize, Serialize};
use socketioxide::{
    extract::{AckSender, Data, SocketRef},
    SocketIo,
};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tracing::info;
use tracing_subscriber::FmtSubscriber;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
enum GameStatus {
    Lobby,
    Active,
    Finished,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Game {
    code: String,
    status: GameStatus,
    center_lat: f64,
    center_lng: f64,
    size_km: f64,
}

#[derive(Debug, Default)]
struct AppStateInner {
    games: HashMap<String, Game>,
}

type AppState = Arc<RwLock<AppStateInner>>;

async fn on_connect(socket: SocketRef, Data(data): Data<Value>) {
    info!(ns = socket.ns(), ?socket.id, "Socket.IO connected");
    socket.emit("auth", &data).ok();

    socket.on("message", async |socket: SocketRef, Data::<Value>(data)| {
        info!(?data, "Received event:");
        socket.emit("message-back", &data).ok();
    });

    socket.on(
        "message-with-ack",
        async |Data::<Value>(data), ack: AckSender| {
            info!(?data, "Received event");
            ack.send(&data).ok();
        },
    );
}

async fn create_game(
    State(state): State<AppState>,
    Json(game): Json<Game>,
) -> Result<Json<Game>, &'static str> {
    let mut state = state.write().unwrap();

    if state.games.contains_key(&game.code) {
        return Err("A game with that name already exists.");
    }

    state.games.insert(game.code.clone(), game.clone());

    Ok(Json(game))
}

async fn get_game(
    State(state): State<AppState>,
    Path(code): Path<String>,
) -> Result<Json<Game>, &'static str> {
    state
        .read()
        .unwrap()
        .games
        .get(&code)
        .map(|g| Json(g.clone()))
        .ok_or("A game with that name was not found.")
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing::subscriber::set_global_default(FmtSubscriber::default())?;

    let (layer, io) = SocketIo::new_layer();

    io.ns("/", on_connect);
    io.ns("/custom", on_connect);

    let app_state = AppState::default();

    let app = axum::Router::new()
        .route("/create-game", post(create_game))
        .route("/games/{code}", get(get_game))
        .layer(layer)
        .with_state(app_state);

    info!("Starting server");

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
