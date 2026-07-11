"use client";

import { useEffect, useState } from "react";
import {
  rankEasyRunLinePicks,
  getUnderdogPick,
  type ScoredPick,
} from "@/lib/erlScore";

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
type ProbablePitcher = {
  homeTeam: string;
  awayTeam: string;
  homePitcher: string;
  awayPitcher: string;
  homeERA: number | null;
  awayERA: number | null;
};
type TeamForm = {
  team: string;
  winsLast10: number;
  lossesLast10: number;
};
type BullpenTeam = {
  team: string;
  bullpenERA: number | null;
  bullpenRank: number | null;
  inningsPitched: number | null;
  strikeouts: number | null;
  walks: number | null;
  homeRunsAllowed: number | null;
};
type Game = {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  homePitcher?: string;
awayPitcher?: string;
homeERA?: number;
awayERA?: number;
homeLast10Wins?: number;
homeLast10Losses?: number;
awayLast10Wins?: number;
awayLast10Losses?: number;
homeBullpenERA?: number;
awayBullpenERA?: number;
homeBullpenRank?: number;
awayBullpenRank?: number;
  bookmakers?: Bookmaker[];
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
  async function loadProbablePitchers() {
  const response = await fetch("/api/mlb-probables");
  const data = await response.json();

  return (data.probables || []) as ProbablePitcher[];
}
async function loadTeamForm() {
  const response = await fetch("/api/mlb-form");
  const data = await response.json();

  return (data.teams || []) as TeamForm[];
}
async function loadBullpenData() {
  const response = await fetch("/api/mlb-bullpen");
  const data = await response.json();

  return (data.bullpens || []) as BullpenTeam[];
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
      const probables = await loadProbablePitchers();
const teamForm = await loadTeamForm();
const bullpenData = await loadBullpenData();

const gamesWithLiveData = (data.games || []).map((game: Game) => {
  const probable = probables.find(
    (p) =>
      p.homeTeam === game.home_team &&
      p.awayTeam === game.away_team
  );

  const homeForm = teamForm.find((team) => team.team === game.home_team);
  const awayForm = teamForm.find((team) => team.team === game.away_team);

  const homeBullpen = bullpenData.find(
    (team) => team.team === game.home_team
  );

  const awayBullpen = bullpenData.find(
    (team) => team.team === game.away_team
  );

  return {
    ...game,

    homePitcher: probable?.homePitcher,
    awayPitcher: probable?.awayPitcher,
    homeERA: probable?.homeERA ?? undefined,
    awayERA: probable?.awayERA ?? undefined,

    homeLast10Wins: homeForm?.winsLast10,
    homeLast10Losses: homeForm?.lossesLast10,
    awayLast10Wins: awayForm?.winsLast10,
    awayLast10Losses: awayForm?.lossesLast10,

    homeBullpenERA: homeBullpen?.bullpenERA ?? undefined,
    awayBullpenERA: awayBullpen?.bullpenERA ?? undefined,
    homeBullpenRank: homeBullpen?.bullpenRank ?? undefined,
    awayBullpenRank: awayBullpen?.bullpenRank ?? undefined,
  };
});

setGames(gamesWithLiveData);

    
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

The +4.5 run line is an EasyRunLine target and is NOT confirmed as currently available at the listed bookmaker.
The live odds feed may only show the standard run line.
Tell the user to verify the exact +4.5 alternate run line in their betting app before placing the bet.
If the exact +4.5 line is unavailable, the recommendation is PASS.
Do not force or invent a replacement selection.
Do not invent a precise cover probability or unsupported percentage.
Use confidence labels such as Very High, High, Moderate, or Low instead of fabricated percentages.
Starting pitcher, recent form, and bullpen data are live intelligence when included in the supplied reasons.
Do not incorrectly describe supplied live pitcher, recent form, or bullpen data as missing.
For the Missing Live Data section:
Only list a data category as missing if it was NOT supplied in the report inputs or reasons.
If bullpen data or bullpen comparisons appear in the supplied reasons, do NOT list Bullpen as missing.
If starting pitcher data or pitcher comparisons appear in the supplied reasons, do NOT list Starting Pitchers as missing.
If recent form data or form comparisons appear in the supplied reasons, do NOT list Recent Form as missing.
Do not use available live data inside the analysis and then describe the same data as missing.
Weather and confirmed lineup data are not supplied unless explicitly included in the prompt.
Do not claim that weather is clear, that there are no adverse conditions, that lineups are confirmed, or that there are no late scratches unless that live data was explicitly supplied.
If no supplied data category is genuinely missing, write: "None from the supplied EasyRunLine intelligence."

Do not describe the visible standard run line as proof of sportsbook belief, bookmaker opinion, or what the sportsbook thinks will happen.
Describe the standard run line only as a visible market signal.
Do not claim the +4.5 targets have strong value solely because the visible standard line is +1.5.
Do not claim positive expected value, +EV, strong betting value, or profitable value unless the exact +4.5 alternate price is supplied.
A larger run cushion may improve cover suitability, but cover suitability is not the same as betting value.
Without the exact +4.5 price, describe matchup suitability only.
Do not infer alternate-line value from the standard +1.5 price.
For the Missing Live Data section:
Only list a data category as missing if it was NOT supplied in the report inputs or reasons.
If bullpen data or bullpen comparisons appear in the supplied reasons, do NOT list Bullpen as missing.
If starting pitcher data or pitcher comparisons appear in the supplied reasons, do NOT list Starting Pitchers as missing.
If recent form data or form comparisons appear in the supplied reasons, do NOT list Recent Form as missing.
Do not use available live data inside the analysis and then describe the same data as missing.
Weather and confirmed lineup data are not supplied unless explicitly included in the prompt.
Do not claim that weather is clear, that there are no adverse conditions, that lineups are confirmed, or that there are no late scratches unless that live data was explicitly supplied.
If no supplied data category is genuinely missing, write: "None from the supplied EasyRunLine intelligence."
Do not describe the visible standard run line as proof of sportsbook belief, bookmaker opinion, or what the sportsbook thinks will happen.
Describe the standard run line only as a visible market signal.
Do not claim the +4.5 target has strong value solely because the visible standard line is +1.5.
MANDATORY REPORT WORDING RULES:
Use the heading "🛡 Cover Outlook". Never use "Estimated Cover Probability".
Never describe an unconfirmed +4.5 line as undervalued, strong value, positive expected value, +EV, or profitable.
Never say a standard +1.5 line reflects sportsbook confidence, sportsbook belief, or bookmaker opinion.
Never assume neutral weather conditions.
If weather data is not supplied, write "Weather: Not supplied."
If confirmed lineup data is not supplied, write "Confirmed Lineups: Not supplied."
Do not place available pitcher or bullpen data under Missing Live Data.
For Missing Live Data, list only genuinely unsupplied categories.
Only explain the selected underdog +4.5 EasyRunLine target.

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

const uniqueMatchups = new Set<string>();

const topTwo = rankedPicks.filter((pick) => {
  const matchupKey = [pick.team, pick.opponent]
    .sort()
    .join(" vs ");

  if (uniqueMatchups.has(matchupKey)) {
    return false;
  }

  uniqueMatchups.add(matchupKey);
  return true;
}).slice(0, 2);

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

The +4.5 run line is an EasyRunLine target and is NOT confirmed as currently available at the listed bookmaker.
The live odds feed may only show the standard run line.
Tell the user to verify the exact +4.5 alternate run line for EACH selected team in their betting app before placing the parlay.

If the exact +4.5 line is unavailable for a selected team, mark that leg as PASS.
Do not force or invent a replacement selection.
Use fewer legs instead of forcing a replacement.
If only one suitable and available +4.5 target remains, recommend the single target instead of pretending a 2-leg parlay is available.

Do not invent precise cover probabilities or unsupported percentages.
Use confidence labels such as Very High, High, Moderate, or Low instead of fabricated percentages.

Starting pitcher, recent form, and bullpen data are live intelligence when included in the supplied reasons.
Do not incorrectly describe supplied live pitcher, recent form, or bullpen data as missing.

Only explain the selected underdog +4.5 EasyRunLine targets.

Selected 2-leg parlay:

${selectedText}

Full ranked underdog board:

${rankedText}
`;

  setQuestion(parlayQuestion);
  analyzeQuestion(parlayQuestion);
}
function findGamesToAvoid() {
  if (games.length === 0) return;

  const rankedPicks = rankEasyRunLinePicks(games);
  const avoidPicks = rankedPicks.slice(-5).reverse();

  if (avoidPicks.length === 0) return;

  const avoidText = avoidPicks
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

  const avoidQuestion = `
Create an EasyRunLine AI report for MLB games to avoid.

IMPORTANT:
These teams were flagged by the EasyRunLine fixed scoring engine.
Do not turn these into recommended plays.
Do not recommend favorites.
Explain why these +4.5 underdog spots are weaker or risky.

Games to avoid:
${avoidText}
`;

  setQuestion(avoidQuestion);
  analyzeQuestion(avoidQuestion);
}
function findBestF5() {
  if (games.length === 0) return;

  const rankedPicks = rankEasyRunLinePicks(games);
  const topPick = rankedPicks[0];

  if (!topPick) return;

  const f5Question = `
Create an EasyRunLine AI report for the best F5 MLB angle.

IMPORTANT:
This is for First 5 Innings only.
Focus on early-game risk, starting pitching, early offense, and first-half cover potential.
Do not present it as a full-game play.
Do not call anything a lock.

The F5 +2.5 or safer alternate line is an EasyRunLine target and is NOT confirmed as currently available at the listed bookmaker.
Tell the user to verify the exact F5 alternate line in their betting app before placing the bet.
If the exact F5 target line is unavailable, the recommendation is PASS.
Do not force or invent a replacement market.
Do not replace the F5 target with a full-game +4.5 play.

Do not invent precise cover probabilities or unsupported percentages.
Use confidence labels such as Very High, High, Moderate, or Low.

Starting pitcher data is the most important live input for this F5 report.
If starting pitcher data or pitcher comparisons appear in the supplied reasons, do NOT describe starting pitcher data as missing.
If starting pitcher data is genuinely absent, clearly state that F5 confidence is limited.

Recent form may support the F5 analysis when included.
Bullpen data is mainly a full-game factor and should not be presented as a primary reason for an F5 recommendation.
Do not use bullpen strength as the main justification for an F5 play.

Weather and confirmed lineup data are not supplied unless explicitly included in the prompt.
Do not claim weather conditions, confirmed lineups, or late-scratch information unless that live data was explicitly supplied.

Do not describe the visible standard full-game run line as confirmation of the F5 alternate market.

Best F5 candidate:
${topPick.team} F5 +2.5 or safer F5 alternate line vs ${topPick.opponent}
ERL Score: ${topPick.score}/100
Moneyline: ${topPick.moneyline}
Standard Run Line Seen: ${topPick.standardRunLine}
Bookmaker: ${topPick.bookmaker}

Reasons:
${topPick.reasons.map((reason) => `- ${reason}`).join("\n")}
`;

  setQuestion(f5Question);
  analyzeQuestion(f5Question);
}
function findBestThreeLegParlay() {
    if (games.length === 0) return;

  const rankedPicks = rankEasyRunLinePicks(games);
  const uniqueGamePicks = rankedPicks.filter((pick, index, allPicks) => {
  const matchupKey = [pick.team, pick.opponent].sort().join(" vs ");

  return (
    index ===
    allPicks.findIndex((otherPick) => {
      const otherMatchupKey = [
        otherPick.team,
        otherPick.opponent,
      ]
        .sort()
        .join(" vs ");

      return otherMatchupKey === matchupKey;
    })
  );
});

const topThree = uniqueGamePicks.slice(0, 3);

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

If you mention the standard sportsbook run line, clearly say it is the visible standard +1.5 line, not the EasyRunLine +4.5 target.

The +4.5 line is the EasyRunLine target and is not confirmed as currently offered by the bookmaker.

Never claim that the exact +4.5 market is available unless confirmed data explicitly provides it.

Clearly tell the user to verify the alternate +4.5 line in their betting app before placing the ticket.

If an exact +4.5 line is unavailable, mark that selection as PASS and advise using fewer legs rather than forcing a replacement.

Do not invent exact cover probabilities or combined parlay probabilities.

Use confidence labels such as Very High, High, Moderate, or Low instead of unsupported percentages.

Starting pitcher, recent form, and bullpen data are live when they appear in the ranked-board reasons.

Do not list those factors as missing when their reasons are present.
For the Missing Live Data section:
Only list a data category as missing if it was NOT supplied in the report inputs or reasons.
If bullpen data or bullpen comparisons appear in the supplied reasons, do NOT list Bullpen as missing.
If starting pitcher data or pitcher comparisons appear in the supplied reasons, do NOT list Starting Pitchers as missing.
If recent form data or form comparisons appear in the supplied reasons, do NOT list Recent Form as missing.
Do not use available live data in the analysis and then describe the same data as missing.
Weather and confirmed lineup data are not supplied unless explicitly included in the prompt.
Do not claim that weather is clear, that there are no adverse conditions, that lineups are confirmed, or that there are no late scratches unless that live data was explicitly supplied.
If no supplied data category is genuinely missing, write: "None from the supplied EasyRunLine intelligence."

Do not describe the visible standard run line as proof of sportsbook belief, bookmaker opinion, or what the sportsbook thinks will happen.
Describe the standard run line only as a visible market signal.
Do not claim the +4.5 targets have strong value solely because the visible standard line is +1.5.
Do not claim positive expected value, +EV, strong betting value, or profitable value unless the exact +4.5 alternate price is supplied.
A larger run cushion may improve cover suitability, but cover suitability is not the same as betting value.
Without the exact +4.5 price, describe matchup suitability only.
Do not infer alternate-line value from the standard +1.5 price.
Say that a team appears suitable as an EasyRunLine +4.5 target, subject to confirming the exact alternate line and price.

Use the section heading "Cover Outlook" instead of "Estimated Cover Probability".
Do not invent numerical cover probabilities or imply a calculated probability exists.

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
  Best 2-Leg +4.5 Parlay
</button>

<button
  onClick={findGamesToAvoid}
  disabled={loading || games.length === 0}
  className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
>
  Games To Avoid
</button>
<button
  onClick={findBestF5}
  disabled={loading || games.length === 0}
  className="rounded-xl bg-cyan-500 px-5 py-3 font-bold text-black transition hover:bg-cyan-400 disabled:opacity-50"
>
  Best F5
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
<div className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-cyan-200">
  <p className="font-bold text-cyan-300">Starting Pitchers</p>
  <p className="mt-1">
    Away: {game.awayPitcher || "TBD"}
    {game.awayERA !== undefined ? ` | ERA: ${game.awayERA}` : ""}
  </p>
  <p>
    Home: {game.homePitcher || "TBD"}
    {game.homeERA !== undefined ? ` | ERA: ${game.homeERA}` : ""}
  </p>
</div>
<div className="mt-3 rounded-xl border border-green-500/30 bg-green-950/20 p-3 text-xs text-green-200">
  <p className="font-bold text-green-300">
    Recent Form — Last 10
  </p>
  <div className="mt-3 rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-xs text-purple-200">
  <p className="font-bold text-purple-300">Bullpen</p>

  <p className="mt-1">
    Away:{" "}
    {game.awayBullpenERA !== undefined
      ? `ERA ${game.awayBullpenERA}${
          game.awayBullpenRank !== undefined
            ? ` | Rank #${game.awayBullpenRank}`
            : ""
        }`
      : "Not available"}
  </p>

  <p>
    Home:{" "}
    {game.homeBullpenERA !== undefined
      ? `ERA ${game.homeBullpenERA}${
          game.homeBullpenRank !== undefined
            ? ` | Rank #${game.homeBullpenRank}`
            : ""
        }`
      : "Not available"}
  </p>
</div>

  <p className="mt-1">
    Away:{" "}
    {game.awayLast10Wins !== undefined &&
    game.awayLast10Losses !== undefined
      ? `${game.awayLast10Wins}-${game.awayLast10Losses}`
      : "Not available"}
  </p>

  <p>
    Home:{" "}
    {game.homeLast10Wins !== undefined &&
    game.homeLast10Losses !== undefined
      ? `${game.homeLast10Wins}-${game.homeLast10Losses}`
      : "Not available"}
  </p>
</div>

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