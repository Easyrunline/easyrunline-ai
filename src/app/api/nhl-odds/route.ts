import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    sport: "NHL",
    endpoint: "nhl-odds",
    status: "ready",
    message: "Live NHL odds integration is not connected yet.",
    games: [],
  });
}