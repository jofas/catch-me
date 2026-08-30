import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url ?? "/", true));
  });

  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("New client!", socket.id);
    socket.on("disconnect", () => {
      // Handle disconnect
    });
  });

  server.listen(3000, () => {
    console.log("Ready on http://localhost:3000");
  });
});
