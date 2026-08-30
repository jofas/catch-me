import { NextResponse } from "next/server";
import { createGame } from "../../../lib/db";

function generateCode(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

export async function POST(request: Request) {
  const { lat, lng, sizeKm } = await request.json();

  const code = generateCode();
  const hostId = crypto.randomUUID();

  createGame(code, hostId, lat, lng, sizeKm);

  return NextResponse.json({ code, hostId });
}
