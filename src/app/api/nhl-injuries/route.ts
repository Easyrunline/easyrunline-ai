import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    sport: "NHL",
    endpoint: "nhl-injuries",
    status: "ready",
    message: "Live NHL injury integration is not connected yet.",
    injuries: [],
  });
}