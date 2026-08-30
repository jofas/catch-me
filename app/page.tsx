"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { squareBounds } from "../lib/geo";

const DraggableRectangle = dynamic(
  () => import("../components/DraggableRectangle"),
  { ssr: false },
);
const GameGrid = dynamic(() => import("../components/GameGrid"), {
  ssr: false,
});

const FALLBACK_CENTER = { lat: 53.54992, lng: 10.00678 };

export default function Home() {
  const router = useRouter();
  const [center, setCenter] = useState(FALLBACK_CENTER);
  const [sizeKm, setSizeKm] = useState(8);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Google Maps API key");
  }

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setError(err.message);
        // setError("Failed to get your location, using default area");
      },
      { enableHighAccuracy: true },
    );
  }, []);

  const bounds = useMemo(
    () => squareBounds(center.lat, center.lng, sizeKm),
    [center.lat, center.lng, sizeKm],
  );

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: center.lat, lng: center.lng, sizeKm }),
      });
      const { code, hostId } = await res.json();

      localStorage.setItem(`catch-me:${code}:playerId`, hostId);
      router.push(`/game/${code}`);
    } catch {
      setError("Failed to create game");
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col gap-4 bg-background p-4">
      <h1 className="text-2xl font-bold">Catch Me</h1>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          Play area size (km)
          <Input
            type="number"
            min={1}
            max={20}
            value={sizeKm}
            onChange={(e) => setSizeKm(Number(e.target.value))}
            className="w-24 text-center"
          />
        </label>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? "Creating..." : "Create Game"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <p className="text-sm text-muted-foreground">
        Drag the rectangle to move the play area.
      </p>

      <div className="flex-1 touch-none">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={12}
            mapId="CATCHME"
            gestureHandling="greedy"
          >
            <DraggableRectangle bounds={bounds} onCenterChange={setCenter} />
            <GameGrid bounds={bounds} />
          </Map>
        </APIProvider>
      </div>
    </div>
  );
}
