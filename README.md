# Gudritis

An online multiplayer trivia game site. 

Currently the actual game part isn't functional since the backend game server isn't finished yet.

## Running tests

Currently there are only tests for the game server.

```bash
cd game_server
cargo test
```

## Building

Building will require cargo to be installed for the game server and node, npm for the frontend.

### For the game server

```bash
cd game_server
cargo build
```

### For the frontend

```bash
cd frontend
npm run build
```

## Disclaimer

This project is very WIP. 