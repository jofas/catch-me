"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { Button } from "../components/ui/button";

export default function Home() {
  useEffect(() => {
    // fingerprint the device - so that we can identify each user uniquely
    const socket = io("http://localhost:3000");

    socket.on("connect", () => {
      console.log("Connected to server");
    });
  });

  return (
    <div className="h-screen bg-background w-screen">
      <Button>Hallo</Button>
    </div>
  );
}
