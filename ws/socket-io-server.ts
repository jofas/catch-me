import { Server } from "socket.io";
import http from "http";
import { removePlayer, updatePlayerPosition, upsertPlayer } from "../lib/db";
import type { PlayerRole } from "../lib/db";

interface JoinPayload {
  gameCode: string;
  playerId: string;
  name: string;
  role: PlayerRole;
}

interface PositionPayload {
  gameCode: string;
  playerId: string;
  lat: number;
  lng: number;
}

export function initSocketIO(server: http.Server) {
  const io = new Server(server);

  io.on("connection", (socket) => {
    socket.on("join", ({ gameCode, playerId, name, role }: JoinPayload) => {
      upsertPlayer(playerId, gameCode, name, role);
      socket.join(gameCode);
      socket.to(gameCode).emit("player-joined", { playerId, name, role });
    });

    socket.on(
      "position",
      ({ gameCode, playerId, lat, lng }: PositionPayload) => {
        updatePlayerPosition(playerId, gameCode, lat, lng);
        socket.to(gameCode).emit("position", { playerId, lat, lng });
      },
    );

    socket.on("leave", ({ gameCode, playerId }: Omit<JoinPayload, "name" | "role">) => {
      removePlayer(playerId);
      socket.to(gameCode).emit("player-left", { playerId });
    });

    socket.on("disconnect", () => {
      // Player position remains in DB; they can rejoin the same game.
    });
  });
}
