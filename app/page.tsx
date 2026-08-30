"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Button } from "../components/ui/button";
const CatchMeMap = dynamic(() => import("../components/CatchMeMap"), {
  ssr: false,
});

const FALLBACK_POSITION = { lat: 53.54992, lng: 10.00678 };

export default function Home() {
  const [position, setPosition] = useState(FALLBACK_POSITION);

  useEffect(() => {
    // fingerprint the device - so that we can identify each user uniquely
    const socket = io("http://localhost:3000");

    socket.on("connect", () => {
      console.log("Connected to server");
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        console.log(pos);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (error) => {
        console.error("Failed to get location", error);
      },
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="h-screen bg-background w-screen">
      <Button>Test</Button>
      <CatchMeMap position={position} />
    </div>
  );
}
