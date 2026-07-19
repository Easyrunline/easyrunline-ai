import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    sport: "NHL",
    endpoint: "nhl-team-stats",
    status: "ready",
    message: "Live NHL team-stat integration is not connected yet.",
    teams: [],
  });
}