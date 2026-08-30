"use client";

import { APIProvider, AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import React from "react";

const CatchMeMap = () => {
  const position = { lat: 53.54992, lng: 10.00678 };
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Google Maps API key");
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map defaultCenter={position} defaultZoom={10} mapId="CATCHME">
        <AdvancedMarker position={position} />
      </Map>
    </APIProvider>
  );
};

export default Map;
