"use client";

import { APIProvider, AdvancedMarker, Map } from "@vis.gl/react-google-maps";

type CatchMeMapProps = {
  position: { lat: number; lng: number };
};

const CatchMeMap = ({ position }: CatchMeMapProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Google Maps API key");
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map defaultCenter={position} defaultZoom={16} mapId="CATCHME">
        <AdvancedMarker position={position} />
      </Map>
    </APIProvider>
  );
};

export default CatchMeMap;
