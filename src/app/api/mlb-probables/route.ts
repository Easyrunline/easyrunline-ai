export async function GET() {
  return Response.json({
    status: "ready",
    probables: [
      {
        homeTeam: "San Francisco Giants",
        awayTeam: "Toronto Blue Jays",
        homePitcher: "TBD",
        awayPitcher: "TBD",
        homeERA: null,
        awayERA: null,
      },
    ],
  });
}