import { existsSync, readFileSync } from "fs";
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse,
} from "http";
import { createServer as createHttpsServer } from "https";
import next from "next";
import { parse } from "url";
import { initSocketIO } from "./ws/socket-io-server";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const certPath = "./certs/dev.pem";
const keyPath = "./certs/dev-key.pem";
const hasCert = existsSync(certPath) && existsSync(keyPath);

app.prepare().then(() => {
  const requestHandler = (req: IncomingMessage, res: ServerResponse) => {
    handle(req, res, parse(req.url ?? "/", true));
  };

  const server = hasCert
    ? createHttpsServer(
        {
          cert: readFileSync(certPath),
          key: readFileSync(keyPath),
        },
        requestHandler,
      )
    : createHttpServer(requestHandler);

  initSocketIO(server);

  server.listen(3000, "0.0.0.0", () => {
    const protocol = hasCert ? "https" : "http";
    console.log(`Ready on ${protocol}://localhost:3000`);
  });
});
