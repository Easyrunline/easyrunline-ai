"use client";

import { useState } from "react";
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

export default function SoccerPage() {
  const [selectedCompetition, setSelectedCompetition] =
  useState("Premier League");
  const [games, setGames] = useState<SoccerGame[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
async function loadSoccerGames(competition: string) {
  setLoading(true);
  setError("");
  setGames([]);

  try {
    const response = await fetch(
      `/api/soccer-odds?competition=${encodeURIComponent(competition)}`
    );

    const data = (await response.json()) as SoccerOddsResponse;

    if (!response.ok) {
      setError(data.error || "Could not load soccer games.");
      return;
    }

    setGames(data.games || []);
  } catch {
    setError("Could not load soccer games.");
  } finally {
    setLoading(false);
  }
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

      {!loading && !error && games.length > 0 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {games.map((game) => {
  const h2h = getMarket(game, "h2h");
  const spreads = getMarket(game, "spreads");
  const totals = getMarket(game, "totals");

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

              <h2 className="mt-3 text-xl font-bold text-white">
                {game.away_team}
              </h2>

              <p className="my-2 text-sm text-gray-500">at</p>

              <h2 className="text-xl font-bold text-white">
                {game.home_team}
              </h2>

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