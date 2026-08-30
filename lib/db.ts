import { Database } from "bun:sqlite";

export const db = new Database("catch-me.sqlite");

db.run(`
  CREATE TABLE IF NOT EXISTS games (
    code TEXT PRIMARY KEY,
    hostId TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'lobby',
    centerLat REAL NOT NULL,
    centerLng REAL NOT NULL,
    sizeKm INTEGER NOT NULL,
    createdAt INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    gameCode TEXT NOT NULL REFERENCES games(code),
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'runner',
    lat REAL,
    lng REAL,
    updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS position_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gameCode TEXT NOT NULL REFERENCES games(code),
    playerId TEXT NOT NULL REFERENCES players(id),
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    recordedAt INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_position_log_game
    ON position_log (gameCode, recordedAt);
`);

export type GameStatus = "lobby" | "active" | "finished";
export type PlayerRole = "runner" | "hunter";

export interface Game {
  code: string;
  hostId: string;
  status: GameStatus;
  centerLat: number;
  centerLng: number;
  sizeKm: number;
  createdAt: number;
}

export interface Player {
  id: string;
  gameCode: string;
  name: string;
  role: PlayerRole;
  lat: number | null;
  lng: number | null;
  updatedAt: number;
}

export interface PositionLogEntry {
  playerId: string;
  lat: number;
  lng: number;
  recordedAt: number;
}

export function createGame(
  code: string,
  hostId: string,
  centerLat: number,
  centerLng: number,
  sizeKm: number,
): void {
  db.query(
    "INSERT INTO games (code, hostId, centerLat, centerLng, sizeKm) VALUES (?, ?, ?, ?, ?)",
  ).run(code, hostId, centerLat, centerLng, sizeKm);
}

export function getGame(code: string): Game | null {
  return db
    .query("SELECT * FROM games WHERE code = ?")
    .get(code) as Game | null;
}

export function upsertPlayer(
  id: string,
  gameCode: string,
  name: string,
  role: PlayerRole,
): void {
  db.query(
    `INSERT INTO players (id, gameCode, name, role)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, role = excluded.role`,
  ).run(id, gameCode, name, role);
}

export function updatePlayerPosition(
  id: string,
  gameCode: string,
  lat: number,
  lng: number,
): void {
  db.query(
    "UPDATE players SET lat = ?, lng = ?, updatedAt = unixepoch() WHERE id = ?",
  ).run(lat, lng, id);

  db.query(
    "INSERT INTO position_log (gameCode, playerId, lat, lng) VALUES (?, ?, ?, ?)",
  ).run(gameCode, id, lat, lng);
}

export function getGameReplay(gameCode: string): PositionLogEntry[] {
  return db
    .query(
      "SELECT playerId, lat, lng, recordedAt FROM position_log WHERE gameCode = ? ORDER BY recordedAt ASC",
    )
    .all(gameCode) as PositionLogEntry[];
}

export function getPlayers(gameCode: string): Player[] {
  return db
    .query("SELECT * FROM players WHERE gameCode = ?")
    .all(gameCode) as Player[];
}

export function removePlayer(id: string): void {
  db.query("DELETE FROM players WHERE id = ?").run(id);
}
