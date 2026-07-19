import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    sport: "NHL",
    endpoint: "nhl-form",
    status: "ready",
    message: "Live NHL recent-form integration is not connected yet.",
    teams: [],
  });
}