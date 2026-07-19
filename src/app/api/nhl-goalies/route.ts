import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    sport: "NHL",
    endpoint: "nhl-goalies",
    status: "ready",
    message: "Live NHL starting goalie integration is not connected yet.",
    goalies: [],
  });
}