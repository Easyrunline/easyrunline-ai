export async function GET() {
  return Response.json({
    status: "ready",
    teams: [
      {
        team: "Pittsburgh Pirates",
        winsLast10: 0,
        lossesLast10: 0,
      },
      {
        team: "Atlanta Braves",
        winsLast10: 0,
        lossesLast10: 0,
      },
    ],
  });
}