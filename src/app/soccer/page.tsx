"use client";

import { useState } from "react";
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

export default function SoccerPage() {
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
const [clubVisuals, setClubVisuals] = useState<
  Record<string, SoccerClubVisual>
>({});
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
      <h1 className="text-3xl font-bold text-yellow-400">
        EasyRunLine Soccer
      </h1>

      <p className="mt-4 text-gray-300">
        Select a competition to access soccer game intelligence and analysis.
      </p>

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
            <h2 className="font-semibold">{competition}</h2>

            <p className="mt-2 text-sm text-gray-400">
              Engine under development
            </p>
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