"use client";

import dynamic from "next/dynamic";
import { use, useMemo } from "react";
import { GameProvider, useGame } from "../../../contexts/GameContext";
import { squareBounds } from "../../../lib/geo";

const CatchMeMap = dynamic(() => import("../../../components/CatchMeMap"), {
  ssr: false,
});

function GameScreen() {
  const { game, position } = useGame();
  const bounds = useMemo(
    () =>
      game ? squareBounds(game.centerLat, game.centerLng, game.sizeKm) : null,
    [game],
  );

  if (!game || !bounds || !position) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        Loading game...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background">
      <CatchMeMap position={position} bounds={bounds} />
    </div>
  );
}

export default function GamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);

  return (
    <GameProvider code={code} name="Player" role="runner">
      <GameScreen />
    </GameProvider>
  );
}
