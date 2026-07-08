"use client";

import { useEffect, useState } from "react";

type Outcome = {
  name: string;
  price: number;
  point?: number;
};

type Market = {
  key: string;
  outcomes: Outcome[];
};

type Bookmaker = {
  title: string;
  markets: Market[];
};

type Game = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers?: Bookmaker[];
};

type ScoredPick = {
  team: string;
  opponent: string;
  side: "home" | "away";
  moneyline: number;
  standardRunLine?: string;
  bookmaker: string;
  score: number;
  reasons: string[];
};
const teamCodes: Record<string, string> = {
  "Arizona Diamondbacks": "ARI",
  "Atlanta Braves": "ATL",
  "Baltimore Orioles": "BAL",
  "Boston Red Sox": "BOS",
  "Chicago Cubs": "CHC",
  "Chicago White Sox": "CWS",
  "Cincinnati Reds": "CIN",
  "Cleveland Guardians": "CLE",
  "Colorado Rockies": "COL",
  "Detroit Tigers": "DET",
  "Houston Astros": "HOU",
  "Kansas City Royals": "KC",
  "Los Angeles Angels": "LAA",
  "Los Angeles Dodgers": "LAD",
  "Miami Marlins": "MIA",
  "Milwaukee Brewers": "MIL",
  "Minnesota Twins": "MIN",
  "New York Mets": "NYM",
  "New York Yankees": "NYY",
  "Oakland Athletics": "OAK",
  "Philadelphia Phillies": "PHI",
  "Pittsburgh Pirates": "PIT",
  "San Diego Padres": "SD",
  "San Francisco Giants": "SF",
  "Seattle Mariners": "SEA",
  "St. Louis Cardinals": "STL",
  "Tampa Bay Rays": "TB",
  "Texas Rangers": "TEX",
  "Toronto Blue Jays": "TOR",
  "Washington Nationals": "WSH",
};

function teamCode(teamName: string) {
  return teamCodes[teamName] || teamName.slice(0, 3).toUpperCase();
}

function logoUrl(teamName: string) {
  const code = teamCode(teamName);
  return `https://a.espncdn.com/i/teamlogos/mlb/500/${code.toLowerCase()}.png`;
}
function getUnderdogPick(game: Game): ScoredPick | null {
  const bookmaker = game.bookmakers?.[0];
  const moneyline = bookmaker?.markets.find((market) => market.key === "h2h");
  const spread = bookmaker?.markets.find((market) => market.key === "spreads");

  if (!bookmaker || !moneyline || moneyline.outcomes.length < 2) return null;

  const awayMl = moneyline.outcomes.find((o) => o.name === game.away_team);
  const homeMl = moneyline.outcomes.find((o) => o.name === game.home_team);

  if (!awayMl || !homeMl) return null;

  const underdog = awayMl.price > homeMl.price ? awayMl : homeMl;
  const favorite = awayMl.price > homeMl.price ? homeMl : awayMl;

  const isHome = underdog.name === game.home_team;
  const opponent = favorite.name;

  let score = 50;
  const reasons: string[] = [];

  score += 20;
  reasons.push("Valid EasyRunLine underdog +4.5 candidate");

  if (isHome) {
    score += 8;
    reasons.push("Home underdog protection");
  }

  const mlGap = underdog.price - favorite.price;

  if (mlGap <= 0.45) {
    score += 18;
    reasons.push("Small moneyline gap suggests competitive matchup");
  } else if (mlGap <= 0.9) {
    score += 10;
    reasons.push("Moderate moneyline gap");
  } else {
    score -= 8;
    reasons.push("Wide moneyline gap increases blowout risk");
  }

  if (underdog.price <= 2.25) {
    score += 10;
    reasons.push("Market does not price this team as a heavy underdog");
  } else if (underdog.price <= 2.8) {
    score += 4;
    reasons.push("Playable underdog range");
  } else {
    score -= 6;
    reasons.push("Heavy underdog profile");
  }

  const underdogSpread = spread?.outcomes.find((o) => o.name === underdog.name);

  if (underdogSpread?.point === 1.5) {
    score += 8;
    reasons.push("Sportsbook standard run line supports this underdog at +1.5");
  }

  // Strong underdog cap: keeps scores realistic until pitchers/weather/lineups are added
if (underdog.price >= 3.0) {
  score = Math.min(score, 78);
} else if (underdog.price >= 2.6) {
  score = Math.min(score, 84);
} else if (underdog.price >= 2.25) {
  score = Math.min(score, 90);
} else {
  score = Math.min(score, 94);
}

score = Math.max(0, Math.min(100, score));

  return {
    team: underdog.name,
    opponent,
    side: isHome ? "home" : "away",
    moneyline: underdog.price,
    standardRunLine:
      underdogSpread?.point !== undefined
        ? `${underdogSpread.point} at ${underdogSpread.price}`
        : "Not available",
    bookmaker: bookmaker.title || "Not available",
    score,
    reasons,
  };
}

function rankEasyRunLinePicks(games: Game[]) {
  return games
    .map((game) => getUnderdogPick(game))
    .filter((pick): pick is ScoredPick => pick !== null)
    .sort((a, b) => b.score - a.score);
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState("");

  useEffect(() => {
    loadMlbGames();
  }, []);

  async function analyzeQuestion(customQuestion?: string) {
    const finalQuestion = customQuestion || question;

    if (!finalQuestion) return;

    setLoading(true);
    setAnswer("");

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: finalQuestion }),
    });

    const data = await response.json();

    setAnswer(data.answer);
    setLoading(false);
  }

  async function loadMlbGames() {
    try {
      setGamesLoading(true);
      setGamesError("");

      const response = await fetch("/api/mlb-odds");
      const data = await response.json();

      if (!response.ok) {
        setGamesError(data.error || "Could not load MLB games.");
        setGames([]);
        return;
      }

      setGames(data.games || []);
    } catch {
      setGamesError("Could not load MLB games.");
      setGames([]);
    } finally {
      setGamesLoading(false);
    }
  }

  function getMarket(game: Game, key: string) {
    return game.bookmakers?.[0]?.markets.find((market) => market.key === key);
  }

  function formatOdds(outcome?: Outcome) {
    if (!outcome) return "N/A";
    const point = outcome.point !== undefined ? `${outcome.point} ` : "";
    return `${outcome.name}: ${point}${outcome.price}`;
  }

  function analyzeGame(game: Game) {
  const moneyline = getMarket(game, "h2h");
const spread = getMarket(game, "spreads");
const total = getMarket(game, "totals");

const gameQuestion = `
Analyze this MLB game for EasyRunLine AI.

Game:
${game.away_team} vs ${game.home_team}

Start Time:
${new Date(game.commence_time).toLocaleString()}

Moneyline:
${moneyline?.outcomes.map((o) => formatOdds(o)).join(" | ") || "Not available"}

Run Line:
${spread?.outcomes.map((o) => formatOdds(o)).join(" | ") || "Not available"}

Total:
${total?.outcomes.map((o) => formatOdds(o)).join(" | ") || "Not available"}

Bookmaker:
${game.bookmakers?.[0]?.title || "Not available"}

Focus specifically on the safest +4.5 alternate run line angle.

Only recommend the underdog +4.5 side.

Never recommend favorite +4.5.
`;

setQuestion(gameQuestion);
analyzeQuestion(gameQuestion);   
  
  }
  function findSafestSingle() {
  if (games.length === 0) return;

  const rankedPicks = rankEasyRunLinePicks(games);
  const topPick = rankedPicks[0];

  if (!topPick) return;

  const singleQuestion = `
Create an EasyRunLine AI report for the safest single +4.5 MLB play.

IMPORTANT:
This pick was selected by the EasyRunLine fixed scoring engine.
Do not change the team.
Do not replace +4.5 with +1.5.
Do not recommend favorites.
Only explain the selected underdog +4.5 side.

Safest single:
${topPick.team} +4.5 vs ${topPick.opponent}
ERL Score: ${topPick.score}/100
Moneyline: ${topPick.moneyline}
Standard Run Line Seen: ${topPick.standardRunLine}
Bookmaker: ${topPick.bookmaker}

Reasons:
${topPick.reasons.map((reason) => `- ${reason}`).join("\n")}
`;

  setQuestion(singleQuestion);
  analyzeQuestion(singleQuestion);
}
function findBestTwoLegParlay() {
  if (games.length === 0) return;

  const rankedPicks = rankEasyRunLinePicks(games);
  const topTwo = rankedPicks.slice(0, 2);

  if (topTwo.length < 2) return;

  const rankedText = rankedPicks
    .map(
      (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}
ERL Score: ${pick.score}/100
Moneyline: ${pick.moneyline}
Standard Run Line Seen: ${pick.standardRunLine}
Bookmaker: ${pick.bookmaker}

Reasons:
${pick.reasons.map((reason) => `- ${reason}`).join("\n")}
`
    )
    .join("\n────────────────────\n");

  const selectedText = topTwo
    .map(
      (pick, index) =>
        `${index + 1}. ${pick.team} +4.5 | ERL Score: ${pick.score}/100`
    )
    .join("\n");

  const parlayQuestion = `
Create an EasyRunLine AI report for the best 2-leg +4.5 MLB parlay.

IMPORTANT:

The picks below were selected by the EasyRunLine fixed scoring engine.

Do not change the teams.

Do not replace +4.5 with +1.5.

Do not recommend favorites.

Only explain the selected underdog +4.5 sides.

Selected 2-leg parlay:

${selectedText}

Full ranked underdog board:

${rankedText}
`;

  setQuestion(parlayQuestion);
  analyzeQuestion(parlayQuestion);
}
function findBestThreeLegParlay() {
    if (games.length === 0) return;

  const rankedPicks = rankEasyRunLinePicks(games);
  const topThree = rankedPicks.slice(0, 3);

  const rankedText = rankedPicks
    .map(
      (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}
ERL Score: ${pick.score}/100
Moneyline: ${pick.moneyline}
Standard Run Line Seen: ${pick.standardRunLine}
Bookmaker: ${pick.bookmaker}
Reasons:
${pick.reasons.map((reason) => `- ${reason}`).join("\n")}
`
    )
    .join("\n━━━━━━━━━━━━━━━━━━━━━━\n");

  const selectedText = topThree
    .map(
      (pick, index) =>
        `${index + 1}. ${pick.team} +4.5 | ERL Score: ${pick.score}/100`
    )
    .join("\n");

  const parlayQuestion = `
Create an EasyRunLine AI report for the best 3-leg +4.5 MLB parlay.

IMPORTANT:
The picks below were selected by the EasyRunLine fixed scoring engine.
Do not change the teams.
Do not replace +4.5 with +1.5.
Do not recommend favorites.
Only explain the selected underdog +4.5 sides.
If you mention standard sportsbook run line, clearly say it is the visible standard +1.5 line, not the EasyRunLine +4.5 target.

Selected 3-leg parlay:
${selectedText}

Full ranked underdog board:
${rankedText}
`;

  setQuestion(parlayQuestion);
  analyzeQuestion(parlayQuestion);
  }

    return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-14 text-center">

<p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-yellow-400">
  EasyRunLine AI
</p>

<h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
  Smarter sports betting analysis.
</h1>

<p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
  Ask questions about run lines, alternate handicaps, blowout risk,
  confidence levels, and hedge ideas across major sports.
</p>

<div className="mt-10 w-full max-w-2xl rounded-2xl border border-yellow-500/30 bg-zinc-950 p-4 shadow-2xl">
  <textarea
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    className="h-32 w-full resize-none rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none"
    placeholder="Ask EasyRunLine AI: Is White Sox +4.5 a good bet tonight?"
  />

  <button
    onClick={() => analyzeQuestion()}
    disabled={loading || !question}
    className="mt-4 w-full rounded-xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
  >
    {loading ? "Analyzing..." : "Analyze"}
  </button>
</div>

{answer && (
  <div className="mt-8 w-full max-w-2xl whitespace-pre-line rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-left text-zinc-200">
    {answer}
  </div>
)}

<div className="mt-14 w-full">
  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
    <div className="text-center sm:text-left">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
        Live Odds
      </p>
      <h2 className="mt-2 text-3xl font-bold">Today's MLB Games</h2>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        onClick={loadMlbGames}
        disabled={gamesLoading}
        className="rounded-xl border border-yellow-500 px-5 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black disabled:opacity-50"
      >
        {gamesLoading ? "Loading..." : "Refresh Games"}
      </button>
<button
  onClick={findSafestSingle}
  disabled={loading || games.length === 0}
  className="rounded-xl bg-blue-500 px-5 py-3 font-bold text-white transition hover:bg-blue-400 disabled:opacity-50"
>
  Safest Single +4.5
</button>
<button
  onClick={findBestTwoLegParlay}
  disabled={loading || games.length === 0}
  className="rounded-xl bg-purple-500 px-5 py-3 font-bold text-white transition hover:bg-purple-400 disabled:opacity-50"
>
  Best 2-Leg +4.5
</button>
      <button
        onClick={findBestThreeLegParlay}
        disabled={loading || games.length === 0}
        className="rounded-xl bg-green-500 px-5 py-3 font-bold text-black transition hover:bg-green-400 disabled:opacity-50"
      >
        Find Best 3-Leg +4.5 Parlay
      </button>
    </div>
  </div>

  {gamesError && (
    <div className="mt-6 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-red-300">
      {gamesError}
    </div>
  )}

          <div className="mt-8 grid w-full gap-5 md:grid-cols-2">
            {games.map((game) => {
              const moneyline = getMarket(game, "h2h");
              const spread = getMarket(game, "spreads");
              const total = getMarket(game, "totals");

              return (
                <div
                  key={game.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-left shadow-xl"
                >
                  <div className="flex items-center justify-between">
  <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
    MLB Matchup
  </p>

  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
    Odds Live ✅
  </span>
</div>

                  <div className="mt-5 flex items-center justify-between gap-4">
  <div className="flex flex-1 flex-col items-center rounded-xl border border-zinc-800 bg-black p-4">
    <img
      src={logoUrl(game.away_team)}
      alt={game.away_team}
      className="h-16 w-16 object-contain"
    />
    <p className="mt-3 text-2xl font-black text-white">
      {teamCode(game.away_team)}
    </p>
    <p className="mt-1 text-center text-xs text-zinc-500">
      {game.away_team}
    </p>
  </div>

  <div className="text-xl font-black text-yellow-400">VS</div>

  <div className="flex flex-1 flex-col items-center rounded-xl border border-zinc-800 bg-black p-4">
    <img
      src={logoUrl(game.home_team)}
      alt={game.home_team}
      className="h-16 w-16 object-contain"
    />
    <p className="mt-3 text-2xl font-black text-white">
      {teamCode(game.home_team)}
    </p>
    <p className="mt-1 text-center text-xs text-zinc-500">
      {game.home_team}
    </p>
  </div>
</div>

                  <p className="mt-2 text-sm text-zinc-400">
                    {new Date(game.commence_time).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
  Bookmaker: {game.bookmakers?.[0]?.title || "Not available"}
</p>

                  <div className="mt-5 space-y-4 text-sm">
                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                      <p className="font-bold text-yellow-400">Moneyline</p>
                      <p className="mt-1 text-zinc-300">
                        {moneyline?.outcomes.map((o) => formatOdds(o)).join(" | ") ||
                          "Not available"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                      <p className="font-bold text-yellow-400">Run Line</p>
                      <p className="mt-1 text-zinc-300">
                        {spread?.outcomes.map((o) => formatOdds(o)).join(" | ") ||
                          "Not available"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                      <p className="font-bold text-yellow-400">Total</p>
                      <p className="mt-1 text-zinc-300">
                        {total?.outcomes.map((o) => formatOdds(o)).join(" | ") ||
                          "Not available"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => analyzeGame(game)}
                    disabled={loading}
                    className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
                  >
                    Analyze +4.5 Angle
                  </button>
                </div>
              );
            })}
                    </div>
        </div>

        <p className="mt-12 text-sm text-zinc-500">
          Discipline. Value. Results. One Unit At A Time.
        </p>
      </section>
    </main>
  );
}