import { getNHLOdds } from "@/lib/nhl/odds";

export async function GET() {
  try {
    const games = await getNHLOdds();

    return Response.json(
      {
        games,
        cacheMinutes: 10,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=600, stale-while-revalidate=1800",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Something went wrong fetching NHL odds.",
      },
      {
        status: 500,
      }
    );
  }
}