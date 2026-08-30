"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import type { Game, PlayerRole } from "../lib/db";

interface RemotePlayer {
  playerId: string;
  name: string;
  role: PlayerRole;
  lat: number | null;
  lng: number | null;
}

interface GameContextValue {
  game: Game | null;
  playerId: string;
  position: { lat: number; lng: number } | null;
  players: Record<string, RemotePlayer>;
}

const GameContext = createContext<GameContextValue | null>(null);

function getOrCreatePlayerId(code: string): string {
  const key = `catch-me:${code}:playerId`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function useGameConnection(
  code: string,
  playerId: string,
  name: string,
  role: PlayerRole,
): Omit<GameContextValue, "playerId"> {
  const [game, setGame] = useState<Game | null>(null);
  const [position, setPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [players, setPlayers] = useState<Record<string, RemotePlayer>>({});

  useEffect(() => {
    fetch(`/api/games/${code}`)
      .then((res) => res.json())
      .then(setGame)
      .catch(() => setGame(null));

    const socket = io();

    socket.on("connect", () => {
      socket.emit("join", { gameCode: code, playerId, name, role });
    });

    socket.on("player-joined", ({ playerId: id, name: n, role: r }) => {
      setPlayers((prev) => ({
        ...prev,
        [id]: { playerId: id, name: n, role: r, lat: null, lng: null },
      }));
    });

    socket.on("player-left", ({ playerId: id }) => {
      setPlayers((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    socket.on("position", ({ playerId: id, lat, lng }) => {
      setPlayers((prev) =>
        prev[id] ? { ...prev, [id]: { ...prev[id], lat, lng } } : prev,
      );
    });

    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(next);
        socket.emit("position", { gameCode: code, playerId, ...next });
      },
      (error) => console.error("Failed to get location", error),
      { enableHighAccuracy: true },
    );

    return () => {
      if (watchId !== undefined) navigator.geolocation?.clearWatch(watchId);
      socket.emit("leave", { gameCode: code, playerId });
      socket.disconnect();
    };
  }, [code, playerId, name, role]);

  return { game, position, players };
}

export function GameProvider({
  code,
  name,
  role,
  children,
}: {
  code: string;
  name: string;
  role: PlayerRole;
  children: React.ReactNode;
}) {
  const playerId = useMemo(() => getOrCreatePlayerId(code), [code]);
  const connection = useGameConnection(code, playerId, name, role);
  const value = useMemo(
    () => ({ playerId, ...connection }),
    [playerId, connection],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
