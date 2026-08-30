# Catch Me

Real-time, GPS-based hide-and-seek. Runs on [Bun](https://bun.sh) with a custom Next.js server (socket.io + SQLite).

## Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Add a Google Maps API key to `.env.local`:

   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
   ```

3. Run it:

   ```bash
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

The SQLite database (`catch-me.sqlite`) is created automatically on first run — no migration step needed.

## Testing on a phone

Geolocation requires a secure context, so a plain `http://` connection won't work on a real device. `server.ts` serves over HTTPS automatically if `certs/dev.pem` and `certs/dev-key.pem` exist. `certs/` is gitignored — generate your own locally with [mkcert](https://github.com/FiloSottile/mkcert) (a mkcert CA is per-machine, so a committed cert would be useless to anyone else anyway):

```bash
nix run nixpkgs#mkcert -- -install
cd certs && TRUST_STORES=system nix run nixpkgs#mkcert -- -cert-file dev.pem -key-file dev-key.pem localhost 127.0.0.1 <your-lan-ip>
```

Then add your LAN IP to `allowedDevOrigins` in `next.config.ts`, and open `https://<your-lan-ip>:3000` on your phone (same Wi-Fi network).

For a native-app feel, use your phone browser's "Add to Home Screen" and open it from there — that's the only way to hide the browser chrome.

## Production

```bash
npm run build
bun run start
```
