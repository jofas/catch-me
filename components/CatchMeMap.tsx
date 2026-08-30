"use client";

import { APIProvider, AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import GameGrid from "./GameGrid";
import type { Bounds } from "../lib/geo";

type CatchMeMapProps = {
  position: { lat: number; lng: number };
  bounds?: Bounds;
};

const CatchMeMap = ({ position, bounds }: CatchMeMapProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Google Maps API key");
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={position}
        defaultZoom={16}
        mapId="CATCHME"
        gestureHandling="greedy"
      >
        <AdvancedMarker position={position} />
        {bounds && <GameGrid bounds={bounds} />}
      </Map>
    </APIProvider>
  );
};

export default CatchMeMap;
