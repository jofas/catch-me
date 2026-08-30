import { Server } from "socket.io";
import http from "http";

export function initSocketIO(server: http.Server) {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("New client!", socket.id);
    socket.on("disconnect", () => {
      // Handle disconnect
    });
  });
}
