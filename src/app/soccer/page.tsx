"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import SportSelector from "@/components/SportSelector";
import {
  buildSoccerIntelligence,
  type RankedSoccerGame,
} from "@/lib/soccer/soccerIntelligence";
import {
  buildSoccerRecommendations,
  type SoccerEngineRecommendation,
} from "@/lib/soccerEngine";
const competitions = [
  "MLS",
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Champions League",
  "Europa League",
];
const competitionLogos: Record<string, string> = {
  MLS:
    "https://r2.thesportsdb.com/images/media/league/badge/dqo6r91549878326.png",

  "Premier League":
    "https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png",

  "La Liga":
    "https://r2.thesportsdb.com/images/media/league/badge/ja4it51687628717.png",

  Bundesliga:
    "https://r2.thesportsdb.com/images/media/league/badge/teqh1b1679952008.png",

  "Serie A":
    "https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png",

  "Ligue 1":
    "https://r2.thesportsdb.com/images/media/league/badge/9f7z9d1742983155.png",

  "Champions League":
    "https://r2.thesportsdb.com/images/media/league/badge/facv1u1742998896.png",

  "Europa League":
    "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png",
};
type SoccerGame = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: SoccerBookmaker[];
};

type SoccerBookmaker = {
  key: string;
  title: string;
  markets: SoccerMarket[];
};

type SoccerMarket = {
  key: string;
  outcomes: SoccerOutcome[];
};

type SoccerOutcome = {
  name: string;
  price: number;
  point?: number;
};

type SoccerOddsResponse = {
  competition: string;
  sportKey: string;
  games: SoccerGame[];
  error?: string;
};
type SoccerClubVisual = {
  team: string;
  badge: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  tertiaryColor: string | null;
  error?: string;
};
type SoccerAlternateTotalBookmaker = {
  key: string;
  title: string;
  outcomes: SoccerOutcome[];
};

type SoccerAlternateTotalsResponse = {
  available?: boolean;
  bookmakers?: SoccerAlternateTotalBookmaker[];
  error?: string;
};

type SoccerUnder45Selection = {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;

  bookmaker: string;
  price: number;
  point: number;

  marketProbability: number;
  safetyScore: number;

  erlScore: number;
  confidence: RankedSoccerGame["confidence"];
  probabilityEdge: number;
};

export default function SoccerPage() {
  const hasLoadedPremierLeague =
  useRef(false);
  const [selectedCompetition, setSelectedCompetition] =
  useState("Premier League");
  const [games, setGames] = useState<SoccerGame[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [rankedGames, setRankedGames] = useState<
  RankedSoccerGame[]
>([]);
const [recommendations, setRecommendations] = useState<
  SoccerEngineRecommendation[]
>([]);

const [safestHandicapPick, setSafestHandicapPick] =
  useState<SoccerEngineRecommendation | null>(null);

const [safestHandicapMessage, setSafestHandicapMessage] =
  useState("");
  const [safestUnder45Pick, setSafestUnder45Pick] =
  useState<SoccerUnder45Selection | null>(
    null
  );

const [safestUnder45Message, setSafestUnder45Message] =
  useState("");

const [safestUnder45Loading, setSafestUnder45Loading] =
  useState(false);
const [clubVisuals, setClubVisuals] = useState<
  Record<string, SoccerClubVisual>
>({});
useEffect(() => {
  if (hasLoadedPremierLeague.current) {
    return;
  }

  hasLoadedPremierLeague.current = true;

  setSelectedCompetition(
    "Premier League"
  );

  loadSoccerGames(
    "Premier League"
  );
}, []);
async function loadSoccerGames(competition: string) {
  setLoading(true);
  setError("");
  setGames([]);
  async function loadClubVisual(
  teamName: string,
  competition: string
) {
  const visualKey = `${competition}:${teamName}`;

  if (clubVisuals[visualKey]) {
    return;
  }

  try {
    const response = await fetch(
      `/api/soccer-club-visuals?team=${encodeURIComponent(
        teamName
      )}&competition=${encodeURIComponent(competition)}`
    );

    const data = (await response.json()) as SoccerClubVisual;

    setClubVisuals((current) => ({
      ...current,
      [visualKey]: data,
    }));
  } catch {
    setClubVisuals((current) => ({
      ...current,
      [visualKey]: {
        team: teamName,
        badge: null,
        primaryColor: null,
        secondaryColor: null,
        tertiaryColor: null,
      },
    }));
  }
}

  try {
    const response = await fetch(
      `/api/soccer-odds?competition=${encodeURIComponent(competition)}`
    );

    const data = (await response.json()) as SoccerOddsResponse;

    if (!response.ok) {
      setError(data.error || "Could not load soccer games.");
      return;
    }

    const rawGames = data.games || [];

const loadedGames = Array.from(
  new Map(
    rawGames.map((game) => {
      const fixtureKey = [
        game.home_team.trim().toLowerCase(),
        game.away_team.trim().toLowerCase(),
        game.commence_time,
      ].join("|");

      return [fixtureKey, game];
    })
  ).values()
);

setGames(loadedGames);

const intelligence = buildSoccerIntelligence(
  loadedGames
);

setRankedGames(intelligence);
const soccerRecommendations =
  buildSoccerRecommendations(intelligence);

setRecommendations(soccerRecommendations);
setSafestHandicapPick(null);
setSafestHandicapMessage("");
setSafestUnder45Pick(null);
setSafestUnder45Message("");
const uniqueTeams = Array.from(
  new Set(
    loadedGames.flatMap((game) => [
      game.home_team,
      game.away_team,
    ])
  )
);

await Promise.all(
  uniqueTeams.map((teamName) =>
    loadClubVisual(teamName, competition)
  )
);
  } catch {
    setError("Could not load soccer games.");
  } finally {
    setLoading(false);
  }
  }
  function findSafestHandicap() {
  setSafestHandicapPick(null);
  setSafestHandicapMessage("");
  setSafestUnder45Pick(null);
setSafestUnder45Message("");

  if (games.length === 0 || rankedGames.length === 0) {
    setSafestHandicapMessage(
      "No soccer games are currently available."
    );
    return;
  }

  const candidates = games
    .map((game) => {
      const handicap = getPositiveHandicapCandidate(game);
      const intelligence = getGameIntelligence(
        rankedGames,
        game.id
      );

      if (!handicap || !intelligence) {
        return null;
      }

      const selectedTeamIsPreferred =
        handicap.team === intelligence.preferredTeam;

      const lineSafetyBonus =
        handicap.line >= 1.5
          ? Math.min(handicap.line * 5, 15)
          : 0;

      const preferredTeamBonus =
        selectedTeamIsPreferred ? 15 : 0;

      const safetyScore =
        intelligence.erlScore +
        lineSafetyBonus +
        preferredTeamBonus;

      return {
        game,
        handicap,
        intelligence,
        safetyScore,
      };
    })
    .filter(
      (
        candidate
      ): candidate is NonNullable<typeof candidate> =>
        candidate !== null
    )
    .filter(
      (candidate) =>
        candidate.handicap.line >= 1.5 &&
        candidate.intelligence.confidence !== "Low"
    )
    .sort((a, b) => b.safetyScore - a.safetyScore);

  const safest = candidates[0];

  if (!safest) {
    setSafestHandicapMessage(
      `No dependable +1.5 or better handicap was identified for ${selectedCompetition}.`
    );
    return;
  }

  setSafestHandicapPick({
    eventId: safest.game.id,
    homeTeam: safest.game.home_team,
    awayTeam: safest.game.away_team,
    preferredTeam: safest.intelligence.preferredTeam,

    erlScore: safest.intelligence.erlScore,
    probabilityEdge: safest.intelligence.probabilityEdge,
    confidence: safest.intelligence.confidence,

    safestHandicapTeam: safest.handicap.team,
    safestHandicapLine: safest.handicap.line,

    safestOver15: false,
    safestUnder45: false,

    blowoutRisk: "Low",
    avoid: false,

    reasons: [
      `${safest.handicap.team} is receiving +${safest.handicap.line}.`,
      `Available price: ${formatPrice(safest.handicap.price)}.`,
      `EasyRunLine score: ${safest.intelligence.erlScore}/100.`,
      `Model confidence: ${safest.intelligence.confidence}.`,
    ],
  });

  setSafestHandicapMessage(
    `${safest.handicap.team} +${safest.handicap.line} is the highest-rated available positive-handicap selection for ${selectedCompetition}.`
  );
}
  async function findSafestUnder45() {
  setSafestUnder45Pick(null);
  setSafestUnder45Message("");

  setSafestHandicapPick(null);
  setSafestHandicapMessage("");

  if (games.length === 0) {
    setSafestUnder45Message(
      "No soccer games are currently available."
    );
    return;
  }

  try {
    setSafestUnder45Loading(true);

    let bestSelection:
      | SoccerUnder45Selection
      | null = null;

    for (const game of games) {
      const response = await fetch(
        `/api/soccer-alternate-totals?eventId=${encodeURIComponent(
          game.id
        )}&competition=${encodeURIComponent(
          selectedCompetition
        )}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        continue;
      }

      const data =
        (await response.json()) as
          SoccerAlternateTotalsResponse;

      if (!data.available) {
        continue;
      }

      const intelligence =
        getGameIntelligence(
          rankedGames,
          game.id
        );

      if (!intelligence) {
        continue;
      }

      const offers = (
        data.bookmakers ?? []
      ).flatMap((bookmaker) =>
        bookmaker.outcomes
          .filter(
            (outcome) =>
              outcome.name
                .trim()
                .toLowerCase() ===
                "under" &&
              outcome.point !== undefined &&
              Math.abs(
                outcome.point - 4.5
              ) < 0.001 &&
              Number.isFinite(
                outcome.price
              ) &&
              outcome.price > 1
          )
          .map((outcome) => ({
            bookmaker:
              bookmaker.title,
            price: outcome.price,
            point:
              outcome.point as number,
          }))
      );

      if (offers.length === 0) {
        continue;
      }

      const bestOffer = [...offers].sort(
        (a, b) => b.price - a.price
      )[0];

      const marketProbability =
        offers.reduce(
          (total, offer) =>
            total + 1 / offer.price,
          0
        ) /
        offers.length *
        100;

      /*
       * This is a conservative market-safety
       * ranking, not a predicted cover probability.
       *
       * A large one-sided matchup edge receives a
       * small penalty because it may carry greater
       * high-score risk.
       */
      const safetyScore = Math.max(
        0,
        Math.min(
          100,
          marketProbability -
            intelligence.probabilityEdge *
              0.15 +
            Math.min(offers.length, 5)
        )
      );

      const selection: SoccerUnder45Selection =
        {
          eventId: game.id,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          commenceTime:
            game.commence_time,

          bookmaker:
            bestOffer.bookmaker,
          price: bestOffer.price,
          point: bestOffer.point,

          marketProbability: Number(
            marketProbability.toFixed(1)
          ),

          safetyScore: Number(
            safetyScore.toFixed(1)
          ),

          erlScore:
            intelligence.erlScore,

          confidence:
            intelligence.confidence,

          probabilityEdge:
            intelligence.probabilityEdge,
        };

      if (
        !bestSelection ||
        selection.safetyScore >
          bestSelection.safetyScore ||
        (selection.safetyScore ===
          bestSelection.safetyScore &&
          selection.price >
            bestSelection.price)
      ) {
        bestSelection = selection;
      }
    }

    if (!bestSelection) {
      setSafestUnder45Message(
        `No verified Under 4.5 market is currently available for ${selectedCompetition}.`
      );
      return;
    }

    setSafestUnder45Pick(
      bestSelection
    );

    setSafestUnder45Message(
      `Under 4.5 at ${formatPrice(
        bestSelection.price
      )} is the highest-rated verified Under 4.5 market currently available for ${selectedCompetition}.`
    );
  } catch (error) {
    console.error(
      "Safest Under 4.5 error:",
      error
    );

    setSafestUnder45Message(
      "Could not complete the Under 4.5 market analysis."
    );
  } finally {
    setSafestUnder45Loading(false);
  }
}

function getClubVisual(
  clubVisuals: Record<string, SoccerClubVisual>,
  competition: string,
  teamName: string
) {
  return clubVisuals[`${competition}:${teamName}`];
}

function getMarket(
  game: SoccerGame,
  marketKey: string
): SoccerMarket | undefined {
  for (const bookmaker of game.bookmakers || []) {
    const market = bookmaker.markets.find(
      (item) => item.key === marketKey
    );

    if (market) {
      return market;
    }
  }

  return undefined;
}
function getMarketBookmaker(
  game: SoccerGame,
  marketKey: string
): string {
  const bookmaker = game.bookmakers?.find((item) =>
    item.markets.some(
      (market) => market.key === marketKey
    )
  );

  return bookmaker?.title ?? "N/A";
}

function getOutcome(
  market: SoccerMarket | undefined,
  outcomeName: string
): SoccerOutcome | undefined {
  return market?.outcomes.find(
    (outcome) => outcome.name === outcomeName
  );
}
function getPositiveHandicapCandidate(
  game: SoccerGame
) {
  const spreadMarket = getMarket(game, "spreads");

  if (!spreadMarket) {
    return null;
  }

  const positiveOutcomes = spreadMarket.outcomes
    .filter(
      (outcome) =>
        outcome.point !== undefined &&
        outcome.point > 0 &&
        (outcome.name === game.home_team ||
          outcome.name === game.away_team)
    )
    .sort(
      (a, b) =>
        Math.abs((a.point ?? 0) - 1.5) -
        Math.abs((b.point ?? 0) - 1.5)
    );

  const outcome = positiveOutcomes[0];

  if (!outcome || outcome.point === undefined) {
    return null;
  }

  return {
    team: outcome.name,
    line: outcome.point,
    price: outcome.price,
  };
}
function getGameIntelligence(
  rankedGames: RankedSoccerGame[],
  eventId: string
) {
  return rankedGames.find(
    (game) => game.eventId === eventId
  );
}

function formatPrice(price?: number) {
  return price !== undefined ? price.toFixed(2) : "N/A";
}

function formatSpread(outcome?: SoccerOutcome) {
  if (
    !outcome ||
    outcome.point === undefined
  ) {
    return "N/A";
  }

  const line =
    outcome.point > 0
      ? `+${outcome.point}`
      : `${outcome.point}`;

  return `${line} at ${formatPrice(outcome.price)}`;
}
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
  <div>
    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      Soccer Intelligence
    </p>

    <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
      EasyRunLine Soccer
    </h1>

    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
      Competition-specific matchup intelligence, verified market data
      and risk-aware football analysis.
    </p>
  </div>

  <div className="shrink-0">
    <SportSelector />
  </div>
</div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {competitions.map((competition) => (
          <button
            type="button"
            key={competition}
            onClick={() => {
  setSelectedCompetition(competition);
  loadSoccerGames(competition);
}}

            className={`rounded-xl border p-5 text-left transition ${
              selectedCompetition === competition
                ? "border-yellow-400 bg-yellow-950/30"
                : "border-gray-800 bg-gray-950 hover:border-gray-600"
            }`}
          >
            <div className="flex items-center gap-3">
  {competitionLogos[competition] ? (
    <img
      src={competitionLogos[competition]}
      alt={`${competition} logo`}
      className="h-10 w-10 shrink-0 object-contain"
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-700 bg-black text-xs font-bold text-gray-400">
      {competition.slice(0, 2).toUpperCase()}
    </div>
  )}

  <h2 className="font-semibold">
    {competition}
  </h2>
</div>

              


          </button>
        ))}
      </div>
            {loading && (
        <div className="mt-8 rounded-xl border border-gray-800 bg-gray-950 p-8 text-center text-gray-400">
          Loading {selectedCompetition} games...
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-xl border border-red-900 bg-red-950/30 p-6 text-red-300">
          {error}
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
  <button
    type="button"
    onClick={findSafestHandicap}
    disabled={loading || games.length === 0}
    className="rounded-lg bg-emerald-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
  >
    Safest Handicap
  </button>
  <button
  type="button"
  onClick={findSafestUnder45}
  disabled={
    loading ||
    games.length === 0 ||
    safestUnder45Loading
  }
  className="rounded-lg bg-cyan-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
>
  {safestUnder45Loading
    ? "Checking Under 4.5..."
    : "Safest Under 4.5"}
</button>
</div>
{safestHandicapPick && (
  <div className="mt-6 rounded-xl border border-emerald-700 bg-emerald-950/20 p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
      EasyRunLine — Safest Handicap
    </p>

    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-gray-500">Selection</p>
        <p className="font-bold text-white">
          {safestHandicapPick.safestHandicapTeam}{" "}
{`+${safestHandicapPick.safestHandicapLine}`}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Matchup</p>
        <p className="font-bold text-white">
          {safestHandicapPick.awayTeam} at{" "}
          {safestHandicapPick.homeTeam}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">ERL Score</p>
        <p className="font-bold text-emerald-400">
          {safestHandicapPick.erlScore}/100
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">Confidence</p>
        <p className="font-bold text-white">
          {safestHandicapPick.confidence}
        </p>
      </div>
    </div>

    <div className="mt-4 border-t border-emerald-900 pt-4">
      <p className="text-xs font-bold uppercase text-emerald-400">
        Why EasyRunLine selected it
      </p>

      <ul className="mt-2 space-y-1 text-sm text-gray-300">
        {safestHandicapPick.reasons.map((reason) => (
          <li key={reason}>• {reason}</li>
        ))}
      </ul>
    </div>
  </div>
)}

{safestHandicapMessage && (
  <div className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/20 p-4 text-sm text-emerald-200">
    {safestHandicapMessage}
  </div>
)}
{safestUnder45Pick && (
  <div className="mt-6 rounded-xl border border-cyan-700 bg-cyan-950/20 p-6">
    <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
      EasyRunLine — Safest Verified Under 4.5
    </p>

    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-gray-500">
          Selection
        </p>

        <p className="font-bold text-white">
          Under {safestUnder45Pick.point}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          Matchup
        </p>

        <p className="font-bold text-white">
          {safestUnder45Pick.awayTeam} at{" "}
          {safestUnder45Pick.homeTeam}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          Price
        </p>

        <p className="font-bold text-cyan-400">
          {formatPrice(
            safestUnder45Pick.price
          )}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          Bookmaker
        </p>

        <p className="font-bold text-white">
          {safestUnder45Pick.bookmaker}
        </p>
      </div>
    </div>

    <div className="mt-4 grid gap-4 border-t border-cyan-900 pt-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <p className="text-xs text-gray-500">
          Start Time
        </p>

        <p className="font-semibold text-white">
          {new Date(
            safestUnder45Pick.commenceTime
          ).toLocaleString()}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          Market Safety Rank
        </p>

        <p className="font-bold text-cyan-400">
          {safestUnder45Pick.safetyScore.toFixed(
            1
          )}
          /100
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          ERL Matchup Score
        </p>

        <p className="font-bold text-white">
          {safestUnder45Pick.erlScore}/100
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          Matchup Confidence
        </p>

        <p className="font-bold text-white">
          {safestUnder45Pick.confidence}
        </p>
      </div>
    </div>

    <div className="mt-4 border-t border-cyan-900 pt-4">
  <p className="text-sm font-bold uppercase tracking-wide text-cyan-400">
    EasyRunLine Market Verdict:{" "}
    {safestUnder45Pick.safetyScore >= 85
      ? "Strong Market Support"
      : safestUnder45Pick.safetyScore >= 70
        ? "Moderate Market Support"
        : "Limited Market Support"}
  </p>

  <p className="mt-2 text-sm leading-6 text-gray-300">
    EasyRunLine ranks Under{" "}
    {safestUnder45Pick.point} in{" "}
    {safestUnder45Pick.awayTeam} at{" "}
    {safestUnder45Pick.homeTeam} as the strongest
    verified safety-oriented total currently available
    in {selectedCompetition}. The exact market is confirmed
    at {formatPrice(safestUnder45Pick.price)} with{" "}
    {safestUnder45Pick.bookmaker}, and the current market
    consensus supports this selection.
  </p>

  <p className="mt-2 text-xs leading-5 text-gray-500">
    This is the system’s preferred market-safety option,
    not a guarantee or a claim of positive betting value.
    Always confirm the displayed line and price before
    placing a wager.
  </p>
</div>
</div>
)}

{safestUnder45Message && (
  <div className="mt-4 rounded-lg border border-cyan-900 bg-cyan-950/20 p-4 text-sm text-cyan-200">
    {safestUnder45Message}
  </div>
)}

      {!loading && !error && games.length > 0 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {games.map((game) => {
  const h2h = getMarket(game, "h2h");
  const spreads = getMarket(game, "spreads");
  const totals = getMarket(game, "totals");
  const intelligence = getGameIntelligence(
  rankedGames,
  game.id
);
const homeVisual = getClubVisual(
  clubVisuals,
  selectedCompetition,
  game.home_team
);

const awayVisual = getClubVisual(
  clubVisuals,
  selectedCompetition,
  game.away_team
);


  const homeMoneyline = getOutcome(h2h, game.home_team);
  const awayMoneyline = getOutcome(h2h, game.away_team);
  const drawMoneyline = getOutcome(h2h, "Draw");

  const homeSpread = getOutcome(spreads, game.home_team);
  const awaySpread = getOutcome(spreads, game.away_team);

  const over = getOutcome(totals, "Over");
  const under = getOutcome(totals, "Under");

  return (
            <div
              key={game.id}
              className="rounded-xl border border-gray-800 bg-gray-950 p-6"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
                {selectedCompetition}
              </p>
              <div className="mt-4 flex items-center justify-between gap-4">
  <div className="flex flex-1 items-center gap-3">
    {awayVisual?.badge ? (
      <img
        src={awayVisual.badge}
        alt={`${game.away_team} logo`}
        className="h-12 w-12 object-contain"
      />
    ) : (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 bg-black text-xs font-bold text-gray-400">
        {game.away_team.slice(0, 2).toUpperCase()}
      </div>
    )}

    <div>
      <p className="text-xs uppercase tracking-widest text-gray-500">
        Away
      </p>
      <h2 className="text-lg font-bold text-white">
        {game.away_team}
      </h2>
    </div>
  </div>

  <div className="shrink-0 rounded-full border border-gray-700 bg-black px-3 py-2 text-xs font-bold uppercase text-gray-400">
    vs
  </div>

  <div className="flex flex-1 items-center justify-end gap-3 text-right">
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-500">
        Home
      </p>
      <h2 className="text-lg font-bold text-white">
        {game.home_team}
      </h2>
    </div>

    {homeVisual?.badge ? (
      <img
        src={homeVisual.badge}
        alt={`${game.home_team} logo`}
        className="h-12 w-12 object-contain"
      />
    ) : (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-700 bg-black text-xs font-bold text-gray-400">
        {game.home_team.slice(0, 2).toUpperCase()}
      </div>
    )}
  </div>
</div>

              

              <p className="mt-4 text-sm text-gray-500">
                {new Date(game.commence_time).toLocaleString()}
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
  <div className="rounded-lg border border-gray-800 bg-black p-4">
    <p className="text-xs font-bold uppercase text-yellow-400">
      1X2 Moneyline
    </p>

    <p className="mt-3 text-sm text-gray-400">
      {game.home_team}
      <span className="ml-2 font-bold text-white">
        {formatPrice(homeMoneyline?.price)}
      </span>
    </p>

    <p className="mt-2 text-sm text-gray-400">
      Draw
      <span className="ml-2 font-bold text-white">
        {formatPrice(drawMoneyline?.price)}
      </span>
    </p>

    <p className="mt-2 text-sm text-gray-400">
      {game.away_team}
      <span className="ml-2 font-bold text-white">
        {formatPrice(awayMoneyline?.price)}
      </span>
    </p>
  </div>

  <div className="rounded-lg border border-gray-800 bg-black p-4">
    <p className="text-xs font-bold uppercase text-yellow-400">
      Spread
    </p>

    <p className="mt-3 text-sm text-gray-400">
      {game.home_team}
      <span className="ml-2 font-bold text-white">
        {formatSpread(homeSpread)}
      </span>
    </p>

    <p className="mt-2 text-sm text-gray-400">
      {game.away_team}
      <span className="ml-2 font-bold text-white">
        {formatSpread(awaySpread)}
      </span>
    </p>
  </div>

  <div className="rounded-lg border border-gray-800 bg-black p-4">
    <p className="text-xs font-bold uppercase text-yellow-400">
      Total Goals
    </p>

    <p className="mt-3 text-sm text-gray-400">
      Over {over?.point ?? "N/A"}
      <span className="ml-2 font-bold text-white">
        {formatPrice(over?.price)}
      </span>
    </p>

    <p className="mt-2 text-sm text-gray-400">
      Under {under?.point ?? "N/A"}
      <span className="ml-2 font-bold text-white">
        {formatPrice(under?.price)}
      </span>
    </p>
  </div>
</div>
{intelligence && (
  <div className="mt-4 rounded-lg border border-yellow-900 bg-yellow-950/20 p-4">
    <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">
      EasyRunLine Intelligence
    </p>

    <div className="mt-3 grid gap-3 sm:grid-cols-4">
      <div>
        <p className="text-xs text-gray-500">
          Preferred Team
        </p>
        <p className="font-bold text-white">
          {intelligence.preferredTeam}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          ERL Score
        </p>
        <p className="font-bold text-yellow-400">
          {intelligence.erlScore}/100
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          Confidence
        </p>
        <p className="font-bold text-white">
          {intelligence.confidence}
        </p>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          Matchup Grade
        </p>
        <p className="font-bold text-white">
          {intelligence.grade}
        </p>
      </div>
    </div>
  </div>
)}

<div className="mt-4 space-y-1 text-xs text-gray-500">
  <p>
    Moneyline bookmaker: {getMarketBookmaker(game, "h2h")}
  </p>

  <p>
    Spread bookmaker: {getMarketBookmaker(game, "spreads")}
  </p>

  <p>
    Total bookmaker: {getMarketBookmaker(game, "totals")}
  </p>
</div>
            </div>
            );
})}
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="mt-8 rounded-xl border border-gray-800 bg-gray-950 p-8 text-center text-gray-500">
          Select a competition to load available fixtures.
        </div>
      )}
    </main>
  );
}