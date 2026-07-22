"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import SportSelector from "@/components/SportSelector";
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
  const answerRef =
  useRef<HTMLDivElement | null>(null);

useEffect(() => {
  if (!answer) {
    return;
  }

  window.setTimeout(() => {
    answerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);
}, [answer]);

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
  async function refreshMlbGames() {
  setQuestion("");
  setAnswer("");
  setLoading(false);

  await loadMlbGames();
}

  function getMarket(game: Game, key: string) {
    return game.bookmakers?.[0]?.markets.find((market) => market.key === key);
  }

  function formatOdds(outcome?: Outcome) {
    if (!outcome) return "N/A";
    const point = outcome.point !== undefined ? `${outcome.point} ` : "";
    return `${outcome.name}: ${point}${outcome.price}`;
  }
  function formatMLBGameStart(
  team: string,
  opponent: string
) {
  const matchingGame = games.find(
    (game) =>
      (game.home_team === team &&
        game.away_team === opponent) ||
      (game.away_team === team &&
        game.home_team === opponent)
  );

  if (!matchingGame) {
    return `Game Date and Time:
Not available`;
  }

  const gameStart = new Date(
    matchingGame.commence_time
  );

  if (
    Number.isNaN(gameStart.getTime())
  ) {
    return `Game Date and Time:
Not available`;
  }

  const localTime =
    gameStart.toLocaleString();

  const utcTime =
    gameStart.toLocaleString("en-GB", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    });

  return `Game Date and Time:
Local: ${localTime}
UTC: ${utcTime} UTC`;
}

  function analyzeGame(game: Game) {
  const moneyline = getMarket(game, "h2h");
  const spread = getMarket(game, "spreads");
  const total = getMarket(game, "totals");

  const rankedPicks = rankEasyRunLinePicks(games);

  const matchupKey = [game.away_team, game.home_team]
    .sort()
    .join(" vs ");

  const enginePick = rankedPicks.find((pick) => {
    const pickMatchupKey = [pick.team, pick.opponent]
      .sort()
      .join(" vs ");

    return pickMatchupKey === matchupKey;
  });

  if (!enginePick) return;

const gameStart = new Date(
  game.commence_time
);

const localStartTime =
  gameStart.toLocaleString();

const utcStartTime =
  gameStart.toLocaleString("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const gameQuestion = `
Create an EasyRunLine AI report explaining the engine decision for this MLB matchup.

IMPORTANT:
This matchup has already been evaluated by the EasyRunLine fixed scoring engine.
Do not perform a separate evaluation.
Do not change the selected underdog.
Do not recommend the favorite +4.5.
Do not replace the EasyRunLine +4.5 target with the standard +1.5 line.

Use the supplied ERL Score exactly as written.
Use the supplied Engine Confidence exactly as written.
Use the supplied Blowout Risk exactly as written.
Do not upgrade, downgrade, average, reinterpret, or replace any engine rating.

Do not invent a numerical cover probability or unsupported percentage.
Use the heading "🛡 Cover Outlook".

Do not describe the exact +4.5 line as available unless confirmed alternate-line data was supplied.
The visible sportsbook feed may only show the standard run line.
Tell the user to verify the exact +4.5 alternate run line and price in their betting app.
If the exact +4.5 market is unavailable, the decision is PASS.

Do not claim positive expected value, +EV, profitable value, good value, strong value, or undervalued status without the exact +4.5 price.
A larger run cushion may improve cover suitability, but cover suitability is not the same as betting value.

Starting pitcher, recent form, and bullpen information are live intelligence when included in the supplied engine reasons.
Do not list starting pitchers, bullpen, or recent form as missing when those factors appear in the supplied reasons.

Weather and confirmed lineup data are not supplied unless explicitly included below.
If weather is not supplied, write: "Weather: Not supplied."
If confirmed lineup data is not supplied, write: "Confirmed Lineups: Not supplied."

Use this exact report structure:

══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

🎯 Recommended +4.5 Side

${enginePick.team} +4.5 vs ${enginePick.opponent}
Game Date and Time:
Local: ${localStartTime}
UTC: ${utcStartTime} UTC

${enginePick.team} — ERL Score: ${enginePick.score}/100 — Engine Confidence: ${enginePick.confidence} — Blowout Risk: ${enginePick.blowoutRisk}

━━━━━━━━━━━━━━━━━━━━━━

📊 Confidence

Use the supplied Engine Confidence exactly as written and explain it briefly.

━━━━━━━━━━━━━━━━━━━━━━

🛡 Cover Outlook

Give a qualitative cover outlook only.
Do not provide a numerical percentage.

━━━━━━━━━━━━━━━━━━━━━━

💥 Blowout Risk

Use the supplied Blowout Risk exactly as written and explain it briefly.

━━━━━━━━━━━━━━━━━━━━━━

💰 Market Value

Explain whether the visible market supports the recommendation.
Do not claim value without the exact +4.5 price.
Remind the user to verify the alternate +4.5 line and price.

━━━━━━━━━━━━━━━━━━━━━━

📖 Live Market

Moneyline:
${moneyline?.outcomes.map((o) => formatOdds(o)).join(" | ") || "Not available"}

Visible Standard Run Line:
${spread?.outcomes.map((o) => formatOdds(o)).join(" | ") || "Not available"}

Total:
${total?.outcomes.map((o) => formatOdds(o)).join(" | ") || "Not available"}

Bookmaker:
${game.bookmakers?.[0]?.title || "Not available"}

━━━━━━━━━━━━━━━━━━━━━━

🧠 Why this Play

Use clear bullet points based only on these engine reasons:
${enginePick.reasons.map((reason) => `• ${reason}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Only list genuinely missing information.
Do not list starting pitchers, bullpen, or recent form as missing when included in the engine reasons.
Weather: Not supplied.
Confirmed Lineups: Not supplied.

━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Verdict

Give one verdict only:
PLAY, LEAN, or PASS.

Base the verdict only on:
- ERL Score: ${enginePick.score}/100
- Engine Confidence: ${enginePick.confidence}
- Blowout Risk: ${enginePick.blowoutRisk}
- the supplied engine reasons
- whether the exact +4.5 market can be verified

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

One Unit Only.
Never chase losses.
Never call anything a lock.
Always explain uncertainty.

Matchup:
${game.away_team} vs ${game.home_team}

Game Date and Time:
Local: ${localStartTime}
UTC: ${utcStartTime} UTC

Do not substitute another game's teams, date, or time.
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
This selection was produced by the EasyRunLine fixed scoring engine.
Do not perform a separate evaluation.
Do not change the selected team.
Do not recommend the favorite.
Do not replace the EasyRunLine +4.5 target with the visible standard +1.5 line.

Use the supplied ERL Score exactly as written.
Use the supplied Engine Confidence exactly as written.
Use the supplied Blowout Risk exactly as written.
Do not upgrade, downgrade, average, reinterpret, or replace these ratings.

Do not invent a numerical cover probability or unsupported percentage.
Use the heading "🛡 Cover Outlook".

The exact +4.5 alternate line and price have not been confirmed.
The visible sportsbook feed may show only the standard run line.
Tell the user to verify the exact +4.5 alternate run line and price in their betting app.
If the exact +4.5 market is unavailable, the final verdict must be PASS.

Do not claim positive expected value, +EV, profitable value, good value, strong value, or undervalued status without the exact +4.5 price.
A larger run cushion may improve cover suitability, but cover suitability is not the same as betting value.

Starting pitcher, recent form, and bullpen information are live intelligence when included in the supplied engine reasons.
Do not list starting pitchers, recent form, or bullpen as missing when those factors appear in the supplied reasons.

Weather and confirmed lineup data were not supplied.
Write:
"Weather: Not supplied."
"Confirmed Lineups: Not supplied."

Use this exact report structure:

══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

🎯 Recommended +4.5 Side

${topPick.team} +4.5 vs ${topPick.opponent}

${formatMLBGameStart(
  topPick.team,
  topPick.opponent
)}

${topPick.team} — ERL Score: ${topPick.score}/100 — Engine Confidence: ${topPick.confidence} — Blowout Risk: ${topPick.blowoutRisk}

━━━━━━━━━━━━━━━━━━━━━━

📊 Confidence

Use the supplied Engine Confidence exactly as written and explain it briefly.

━━━━━━━━━━━━━━━━━━━━━━

🛡 Cover Outlook

Give a qualitative cover outlook only.
Do not provide a numerical percentage.

━━━━━━━━━━━━━━━━━━━━━━

💥 Blowout Risk

Use the supplied Blowout Risk exactly as written and explain it briefly.

━━━━━━━━━━━━━━━━━━━━━━

💰 Market Value

Explain what the visible market shows without claiming sportsbook belief or guaranteed value.
Do not claim betting value without the exact +4.5 price.
Remind the user to verify the alternate +4.5 line and price.

━━━━━━━━━━━━━━━━━━━━━━

📖 Live Market

Moneyline:
${topPick.team}: ${topPick.moneyline}

Visible Standard Run Line:
${topPick.standardRunLine}

Bookmaker:
${topPick.bookmaker}

━━━━━━━━━━━━━━━━━━━━━━

🧠 Why this Play

Use clear bullet points based only on these engine reasons:
${topPick.reasons.map((reason) => `• ${reason}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Only list genuinely missing information.
Do not list starting pitchers, recent form, or bullpen as missing when they appear in the supplied engine reasons.

Weather: Not supplied.
Confirmed Lineups: Not supplied.

━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Verdict

Give one verdict only:
PLAY, LEAN, or PASS.

Base the verdict only on:
- ERL Score: ${topPick.score}/100
- Engine Confidence: ${topPick.confidence}
- Blowout Risk: ${topPick.blowoutRisk}
- the supplied engine reasons
- whether the exact +4.5 alternate market can be verified

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

One Unit Only.
Never chase losses.
Never call anything a lock.
Always explain uncertainty.
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
Engine Confidence: ${pick.confidence}
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
    (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}
${formatMLBGameStart(
  pick.team,
  pick.opponent
)}
${pick.team} — ERL Score:${pick.score}/100 — Engine Confidence: ${pick.confidence} — Blowout Risk: ${pick.blowoutRisk}
`
  )
  .join("\n\n");

  const parlayQuestion = `
Create an EasyRunLine AI report for the best 2-leg +4.5 MLB parlay.

IMPORTANT:
These two selections were produced by the EasyRunLine fixed scoring engine.
Do not perform a separate evaluation.
Do not change either selected team.
Do not recommend favorites.
Do not add a third selection.
Do not replace either EasyRunLine +4.5 target with the visible standard +1.5 line.

Use every supplied ERL Score exactly as written.
Use every supplied Engine Confidence exactly as written.
Use every supplied Blowout Risk exactly as written.
Do not upgrade, downgrade, average, reinterpret, or replace any engine rating.

Do not invent a combined ERL Score.
Do not invent a combined confidence label.
Do not invent a numerical cover probability or unsupported percentage.
Use the heading "🛡 Cover Outlook".

The exact +4.5 alternate lines and prices have not been confirmed.
The visible sportsbook feed may show only the standard run line.
Tell the user to verify the exact +4.5 alternate run line and price for BOTH selections in their betting app.

If the exact +4.5 market is unavailable for either selected team, mark that leg as PASS.
Do not force or invent a replacement team.
Use fewer legs rather than substituting a selection outside the engine choices.
If only one selected +4.5 market is available, recommend using the available selection as a single instead of presenting an incomplete 2-leg parlay.

Do not claim positive expected value, +EV, profitable value, good value, strong value, or undervalued status without the exact +4.5 prices.
A larger run cushion may improve cover suitability, but cover suitability is not the same as betting value.

Starting pitcher, recent form, and bullpen information are live intelligence when included in the supplied engine reasons.
Do not list starting pitchers, recent form, or bullpen as missing when those factors appear in the supplied reasons.

Weather and confirmed lineup data were not supplied.
Write:
"Weather: Not supplied."
"Confirmed Lineups: Not supplied."

Use this exact report structure:

══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

🎯 Recommended 2-Leg +4.5 Parlay

${selectedText}

━━━━━━━━━━━━━━━━━━━━━━

📊 Confidence

Discuss the two supplied Engine Confidence ratings separately.
Do not create or invent a combined confidence rating.
Explain briefly how the two individual confidence levels affect the overall strength of the parlay.

━━━━━━━━━━━━━━━━━━━━━━

🛡 Cover Outlook

Give a qualitative cover outlook for each selected team.
Do not provide numerical percentages.
Do not guarantee that either team will cover.

━━━━━━━━━━━━━━━━━━━━━━

💥 Blowout Risk Summary

Reproduce each selected team's supplied Blowout Risk exactly as written.
Explain briefly how each risk level affects the 2-leg parlay.
Do not average or replace the supplied risk labels.

━━━━━━━━━━━━━━━━━━━━━━

💰 Market Value

Explain what the visible markets show without claiming sportsbook belief or guaranteed value.
Do not claim betting value without the exact +4.5 alternate prices.
Remind the user to verify the exact +4.5 line and price for both selections.
If either alternate market is unavailable, do not force the 2-leg parlay.

━━━━━━━━━━━━━━━━━━━━━━

📖 Selected Market Details

Use only the following engine-supplied information for the two selected plays:

${topTwo
  .map(
    (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}
Moneyline: ${pick.moneyline}
Visible Standard Run Line: ${pick.standardRunLine}
Bookmaker: ${pick.bookmaker}
`
  )
  .join("\n")}

━━━━━━━━━━━━━━━━━━━━━━

🧠 Why These Plays

Explain each selected play separately using clear bullet points based only on its supplied engine reasons.

${topTwo
  .map(
    (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}

${pick.reasons.map((reason) => `• ${reason}`).join("\n")}
`
  )
  .join("\n")}

Do not discuss or recommend teams outside these two selections.

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Only list genuinely missing information.
Do not list starting pitchers, recent form, or bullpen as missing when those factors appear in the supplied engine reasons.

Weather: Not supplied.
Confirmed Lineups: Not supplied.
Exact +4.5 alternate prices: Not supplied.

━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Verdict

Give one clear verdict for the proposed 2-leg parlay:
PLAY, LEAN, or PASS.

Base the verdict only on:
- the two supplied ERL Scores
- each supplied Engine Confidence
- each supplied Blowout Risk
- the supplied engine reasons
- whether both exact +4.5 alternate markets can be verified

Do not invent a combined score or probability.
If either exact +4.5 alternate market cannot be verified, state that the affected leg is PASS and that the user should not force the full 2-leg parlay.

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

One Unit Only.
Never chase losses.
Never call anything a lock.
Always explain uncertainty.
`;


  setQuestion(parlayQuestion);
  analyzeQuestion(parlayQuestion);
}
function findGamesToAvoid() {
  if (games.length === 0) return;

  const rankedPicks = rankEasyRunLinePicks(games);

const matchupKeyFor = (team: string, opponent: string) =>
  [team, opponent].sort().join(" vs ");

const uniqueRecommendedMatchups = new Set<string>();

const recommendedMatchups = new Set(
  rankedPicks
    .filter((pick) => {
      const matchupKey = matchupKeyFor(pick.team, pick.opponent);

      if (uniqueRecommendedMatchups.has(matchupKey)) {
        return false;
      }

      uniqueRecommendedMatchups.add(matchupKey);
      return true;
    })
    .slice(0, 3)
    .map((pick) => matchupKeyFor(pick.team, pick.opponent))
);

const uniqueAvoidMatchups = new Set<string>();

const avoidPicks = [...rankedPicks]
  .reverse()
  .filter((pick) => {
    const matchupKey = matchupKeyFor(pick.team, pick.opponent);

    // Never flag a matchup selected by the safest single,
    // best 2-leg, best 3-leg, or F5 recommendation.
    if (recommendedMatchups.has(matchupKey)) {
      return false;
    }

    // Only include genuinely weak engine-confidence spots.
    // This prevents the feature from forcing moderate or strong plays
    // into the avoid report on smaller MLB slates.
    if (!["Very Low", "Low"].includes(pick.confidence)) {
      return false;
    }

    if (uniqueAvoidMatchups.has(matchupKey)) {
      return false;
    }

    uniqueAvoidMatchups.add(matchupKey);
    return true;
  })
  .slice(0, 5);

  if (avoidPicks.length === 0) return;

  const avoidText = avoidPicks
    .map(
      (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}
${formatMLBGameStart(
  pick.team,
  pick.opponent
)}
Engine Rating: ${pick.team} — ERL Score: ${pick.score}/100 — Engine Confidence: ${pick.confidence} — Blowout Risk: ${pick.blowoutRisk}
Moneyline: ${pick.moneyline}
Standard Run Line Seen: ${pick.standardRunLine}
Bookmaker: ${pick.bookmaker}

Reasons:
${pick.reasons.map((reason) => `- ${reason}`).join("\n")}
`
    )
    .join("\n────────────────────\n");

  const avoidQuestion = `
Create an EasyRunLine AI report for MLB games the EasyRunLine engine recommends avoiding.

IMPORTANT:

These matchups were rejected by the EasyRunLine fixed scoring engine.

Do not recommend these plays.

Do not suggest betting these teams simply because they receive +4.5 runs.

Do not recommend favorites instead.

Use every supplied ERL Score exactly as written.

Use every supplied Engine Confidence exactly as written.

Use every supplied Blowout Risk exactly as written.

Do not upgrade, downgrade, average or reinterpret any engine ratings.

Do not invent cover probabilities.

Do not invent expected value.

Do not claim sportsbook opinion.

Starting pitcher, recent form and bullpen information are live intelligence whenever they appear in the supplied reasons.

Do not list those categories as missing if they already appear.

Weather and confirmed lineups were not supplied.

══════════════════════════════
⚠ EASYRUNLINE AI REPORT
══════════════════════════════

🚫 Games To Avoid

${avoidText}

━━━━━━━━━━━━━━━━━━━━━━

📊 Why These Games Failed

Explain why these matchups fall below the EasyRunLine recommendation threshold.

Discuss:

• lower ERL Scores

• weaker Engine Confidence

• elevated Blowout Risk

Do not invent new statistics.

━━━━━━━━━━━━━━━━━━━━━━

💥 Blowout Risk Summary

Reproduce every supplied Blowout Risk exactly as written.

Briefly explain why elevated blowout risk reduces confidence in these +4.5 plays.

━━━━━━━━━━━━━━━━━━━━━━

📉 Risk Factors

Using only the supplied engine reasons, explain the biggest concerns for each avoided matchup.

Do not recommend betting any of these games.

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Only list genuinely missing information.

Weather: Not supplied.

Confirmed Lineups: Not supplied.

Exact +4.5 alternate prices: Not supplied.

━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Verdict

State clearly that these matchups currently fall below the EasyRunLine recommendation threshold.

Do not suggest replacing them with different teams.

Do not recommend any wager from this list.

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

Passing on weak opportunities is part of long-term bankroll management.

One Unit Only.

Never chase losses.

Never force action when the engine says no.
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
Create an EasyRunLine AI report for the best First 5 Innings MLB angle.

IMPORTANT:
This selection was produced by the EasyRunLine fixed scoring engine.
Do not perform a separate selection process.
Do not change the selected team.
Do not recommend the opponent.
Do not convert this into a full-game +4.5 recommendation.
Do not replace the EasyRunLine F5 target with the visible full-game standard run line.

This report is for the First 5 Innings only.

The EasyRunLine target is:
${topPick.team} F5 +2.5 or a safer F5 alternate line vs ${topPick.opponent}

Use the supplied ERL Score exactly as written.
Use the supplied Engine Confidence exactly as written.
Use the supplied Blowout Risk exactly as written.
Do not upgrade, downgrade, average, reinterpret, or replace any engine rating.

Do not invent a separate F5 score.
Do not invent a separate F5 confidence label.
Do not invent numerical cover probabilities or unsupported percentages.
Do not call the play a lock.

The exact F5 +2.5 or safer alternate line and price have not been confirmed.
Tell the user to verify the exact F5 alternate line and price in their betting app.

If the exact F5 target market is unavailable, the recommendation is PASS.
Do not invent or force a replacement market.
Do not replace the F5 target with a full-game +4.5 play.

Starting-pitcher information is the most important live factor for this report.
If starting-pitcher data or pitcher comparisons appear in the supplied engine reasons, do not describe starting-pitcher data as missing.

Recent form may support the early-game outlook when it appears in the supplied reasons.

Bullpen data is mainly a full-game factor.
Do not use bullpen strength as the primary reason for this F5 recommendation.
If bullpen information appears in the supplied reasons, acknowledge that it has less importance before the sixth inning.

Weather and confirmed lineup information were not supplied.

Use this exact report structure:

══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

🔥 Best F5 Angle

${topPick.team} F5 +2.5 or safer F5 alternate line vs ${topPick.opponent}

${formatMLBGameStart(
  topPick.team,
  topPick.opponent
)}

${topPick.team} —
ERL Score: ${topPick.score}/100
Engine Confidence: ${topPick.confidence}
Blowout Risk: ${topPick.blowoutRisk}

━━━━━━━━━━━━━━━━━━━━━━

📊 Confidence

Reproduce the supplied Engine Confidence exactly as written.

Explain briefly what that confidence level means for the First 5 Innings target.

Do not create a different F5 confidence label.

━━━━━━━━━━━━━━━━━━━━━━

🛡 F5 Cover Outlook

Give a qualitative outlook for the selected team's ability to remain within the F5 target through five innings.

Focus on:
- starting pitching
- early offense
- recent first-half suitability where supported
- risk of falling behind early

Do not provide percentages.
Do not guarantee the cover.

━━━━━━━━━━━━━━━━━━━━━━

⚾ Starting Pitching Edge

Explain the starting-pitching information using only the supplied engine reasons.

If pitcher information is present, use it directly.

If pitcher information is genuinely absent, state:
"Starting Pitchers: Not supplied. F5 confidence is limited."

Do not invent pitcher names, ERAs, handedness, form, or matchup history.

━━━━━━━━━━━━━━━━━━━━━━

🚀 Early-Offense Outlook

Explain whether the supplied reasons support the selected team's ability to stay competitive during the first five innings.

Do not invent inning splits, first-five records, batting statistics, or scoring trends that were not supplied.

━━━━━━━━━━━━━━━━━━━━━━

💥 Early Blowout Risk

Reproduce the supplied Blowout Risk exactly as written.

Explain how that risk applies specifically to the possibility of the selected team falling outside the F5 cushion before the end of the fifth inning.

Do not replace or reinterpret the engine label.

━━━━━━━━━━━━━━━━━━━━━━

💰 Market Value

The exact F5 alternate price was not supplied.

Do not claim positive expected value, +EV, strong value, profitable value, or sportsbook confidence.

State that the matchup may be suitable for the EasyRunLine F5 target, subject to confirming the exact alternate line and price.

If the exact target is unavailable, mark the recommendation as PASS.

━━━━━━━━━━━━━━━━━━━━━━

📖 Visible Market Details

Moneyline: ${topPick.moneyline}

Visible Full-Game Standard Run Line: ${topPick.standardRunLine}

Bookmaker: ${topPick.bookmaker}

Clearly state that this visible full-game market does not confirm the availability or price of the F5 alternate target.

━━━━━━━━━━━━━━━━━━━━━━

🧠 Why This F5 Play

Explain the recommendation using only these supplied engine reasons:

${topPick.reasons.map((reason) => `• ${reason}`).join("\n")}

Prioritize starting-pitching and early-game factors.

Do not use bullpen strength as the main justification.

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Only list genuinely missing information.

Do not list starting pitchers or recent form as missing when those factors appear in the supplied engine reasons.

Weather: Not supplied.

Confirmed Lineups: Not supplied.

Exact F5 alternate line and price: Not supplied.

━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Verdict

Give one clear verdict:

PLAY

LEAN

or

PASS.

Base the verdict only on:
- the supplied ERL Score
- the supplied Engine Confidence
- the supplied Blowout Risk
- the supplied engine reasons
- whether the exact F5 target market can be verified

Do not invent a new score, confidence label, or probability.

If the exact F5 target market cannot be verified, state PASS.

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

One Unit Only.

Never chase losses.

Never call anything a lock.

F5 bets cover only the First 5 Innings.

Always verify the exact F5 alternate line and price.
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
Engine Rating: ${pick.team} — ERL Score: ${pick.score}/100 — Engine Confidence: ${pick.confidence}
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
    (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}
${formatMLBGameStart(
  pick.team,
  pick.opponent
)}
${pick.team} — ERL Score: ${pick.score}/100 — Engine Confidence: ${pick.confidence} — Blowout Risk: ${pick.blowoutRisk}
`
  )
  .join("\n\n");

  const parlayQuestion = `
Create an EasyRunLine AI report for the best 3-leg +4.5 MLB parlay.

IMPORTANT:
These three selections were produced by the EasyRunLine fixed scoring engine.
Do not perform a separate evaluation.
Do not change the selected teams.
Do not recommend favorites.
Do not add or remove teams.
Do not replace the EasyRunLine +4.5 targets with the visible standard +1.5 lines.

Use every supplied ERL Score exactly as written.
Use every supplied Engine Confidence exactly as written.
Use every supplied Blowout Risk exactly as written.
Do not upgrade, downgrade, average, reinterpret, or replace any engine ratings.

Do not invent a combined ERL Score.
Do not invent a combined confidence label.
Do not invent numerical cover probabilities or unsupported percentages.

Use the heading "🛡 Cover Outlook".

The exact +4.5 alternate run lines and prices have not been confirmed.
The visible sportsbook feed may only show the standard run line.

Tell the user to verify the exact +4.5 alternate run line and price for ALL THREE selections before placing the parlay.

If any exact +4.5 alternate market is unavailable:

- mark that leg as PASS
- never invent a replacement team
- recommend using fewer legs instead of forcing the ticket

Starting pitcher, recent form and bullpen information are live intelligence whenever they appear in the supplied engine reasons.

Do not list those categories as missing if they appear in the supplied reasons.

Weather and confirmed lineup data were not supplied.

Use this exact report format:

══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

🎯 Recommended 3-Leg +4.5 Parlay

${selectedText}

━━━━━━━━━━━━━━━━━━━━━━

📊 Confidence

Discuss each team's supplied Engine Confidence individually.

Do not invent a combined confidence rating.

Explain how the three confidence levels affect the strength of the parlay.

━━━━━━━━━━━━━━━━━━━━━━

🛡 Cover Outlook

Give a qualitative cover outlook for each selected team.

Do not provide percentages.

━━━━━━━━━━━━━━━━━━━━━━

💥 Blowout Risk Summary

Reproduce every supplied Blowout Risk exactly as written.

Explain briefly how each team's risk affects the parlay.

━━━━━━━━━━━━━━━━━━━━━━

💰 Market Value

Explain what the visible markets show.

Do not claim betting value without the exact +4.5 alternate prices.

Remind the user to verify every +4.5 alternate run line before placing the parlay.

━━━━━━━━━━━━━━━━━━━━━━

📖 Selected Market Details

${topThree
  .map(
    (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}

Moneyline: ${pick.moneyline}

Visible Standard Run Line:
${pick.standardRunLine}

Bookmaker:
${pick.bookmaker}
`
  )
  .join("\n")}

━━━━━━━━━━━━━━━━━━━━━━

🧠 Why These Plays

Explain each selected play separately using only the supplied engine reasons.

${topThree
  .map(
    (pick, index) => `
${index + 1}. ${pick.team}

${pick.reasons.map((reason) => `• ${reason}`).join("\n")}
`
  )
  .join("\n")}

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Only list genuinely missing information.

Do not list starting pitchers, recent form or bullpen as missing if those appear in the supplied engine reasons.

Weather: Not supplied.

Confirmed Lineups: Not supplied.

Exact +4.5 alternate prices: Not supplied.

━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Verdict

Give one verdict only:

PLAY

LEAN

or

PASS.

Base the verdict only on:

• the supplied ERL Scores

• the supplied Engine Confidence labels

• the supplied Blowout Risk labels

• the supplied engine reasons

• whether the three +4.5 alternate markets can be verified

Do not invent combined scores or probabilities.

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

One Unit Only.

Never chase losses.

Never call anything a lock.

Always explain uncertainty.
`; 

  setQuestion(parlayQuestion);
  analyzeQuestion(parlayQuestion);
  }

    return (
    <main className="min-h-screen bg-black text-white">
      

      <header className="bg-black/95">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
    <div>
      <p className="text-sm font-bold tracking-[0.25em] text-yellow-400">
        EASYRUNLINE AI
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        Multi-Sport Intelligence
      </p>
    </div>

    <SportSelector />
  </div>
</header>
      
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
  <div
    ref={answerRef}
    className="scroll-mt-6 mt-8 w-full max-w-2xl whitespace-pre-line rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-left text-zinc-200"
  >
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
        onClick={refreshMlbGames}
        disabled={gamesLoading}
        className="rounded-xl border border-yellow-500 px-5 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black disabled:opacity-50"
      
      >
        {gamesLoading ? "Loading..." : "Refresh Games"}
      </button>
<button
  onClick={findSafestSingle}
  disabled={
  loading ||
  gamesLoading ||
  games.length === 0
}
  className="rounded-xl bg-blue-500 px-5 py-3 font-bold text-white transition hover:bg-blue-400 disabled:opacity-50"
>
  Safest Single +4.5
</button>
<button
  onClick={findBestTwoLegParlay}
  disabled={
  loading ||
  gamesLoading ||
  games.length === 0
}
  className="rounded-xl bg-purple-500 px-5 py-3 font-bold text-white transition hover:bg-purple-400 disabled:opacity-50"
>
  Best 2-Leg +4.5 Parlay
</button>

<button
  onClick={findGamesToAvoid}
  disabled={
  loading ||
  gamesLoading ||
  games.length === 0
}
  className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
>
  Games To Avoid
</button>
<button
  onClick={findBestF5}
  disabled={
  loading ||
  gamesLoading ||
  games.length === 0
}
  className="rounded-xl bg-cyan-500 px-5 py-3 font-bold text-black transition hover:bg-cyan-400 disabled:opacity-50"
>
  Best F5
</button>
      <button
        onClick={findBestThreeLegParlay}
        disabled={
  loading ||
  gamesLoading ||
  games.length === 0
}
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
              const matchupKey = [game.away_team, game.home_team]
  .sort()
  .join(" vs ");

const enginePick = rankEasyRunLinePicks(games).find((pick) => {
  const pickMatchupKey = [pick.team, pick.opponent]
    .sort()
    .join(" vs ");

  return pickMatchupKey === matchupKey;
});

const engineVerdict =
  !enginePick
    ? "PASS"
    : enginePick.score >= 70
      ? "PLAY"
      : enginePick.score >= 50
        ? "BORDERLINE"
        : "AVOID";

const isQualifiedCandidate = Boolean(enginePick);

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
  <p className="font-bold text-cyan-300">
    Starting Pitchers
  </p>

  <p className="mt-2">
    <span className="font-semibold text-white">
      {game.away_team}:
    </span>{" "}
    {game.awayPitcher || "TBD"}
    {game.awayERA !== undefined
      ? ` | ERA: ${game.awayERA}`
      : ""}
  </p>

  <p className="mt-1">
    <span className="font-semibold text-white">
      {game.home_team}:
    </span>{" "}
    {game.homePitcher || "TBD"}
    {game.homeERA !== undefined
      ? ` | ERA: ${game.homeERA}`
      : ""}
  </p>
</div>

<div className="mt-3 rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-xs text-purple-200">
  <p className="font-bold text-purple-300">
    Bullpen
  </p>

  <p className="mt-2">
    <span className="font-semibold text-white">
      {game.away_team}:
    </span>{" "}
    {game.awayBullpenERA !== undefined
      ? `ERA ${game.awayBullpenERA}${
          game.awayBullpenRank !== undefined
            ? ` | Rank #${game.awayBullpenRank}`
            : ""
        }`
      : "Not available"}
  </p>

  <p className="mt-1">
    <span className="font-semibold text-white">
      {game.home_team}:
    </span>{" "}
    {game.homeBullpenERA !== undefined
      ? `ERA ${game.homeBullpenERA}${
          game.homeBullpenRank !== undefined
            ? ` | Rank #${game.homeBullpenRank}`
            : ""
        }`
      : "Not available"}
  </p>
</div>

<div className="mt-3 rounded-xl border border-green-500/30 bg-green-950/20 p-3 text-xs text-green-200">
  <p className="font-bold text-green-300">
    Recent Form — Last 10
  </p>

  <p className="mt-2">
    <span className="font-semibold text-white">
      {game.away_team}:
    </span>{" "}
    {game.awayLast10Wins !== undefined &&
    game.awayLast10Losses !== undefined
      ? `${game.awayLast10Wins}-${game.awayLast10Losses}`
      : "Not available"}
  </p>

  <p className="mt-1">
    <span className="font-semibold text-white">
      {game.home_team}:
    </span>{" "}
    {game.homeLast10Wins !== undefined &&
    game.homeLast10Losses !== undefined
      ? `${game.homeLast10Wins}-${game.homeLast10Losses}`
      : "Not available"}
  </p>
</div>
<div className="mt-3 rounded-xl border border-yellow-500/30 bg-yellow-950/20 p-4 text-sm">
  <p className="font-bold text-yellow-300">
    🧠 EasyRunLine Decision
  </p>

  {isQualifiedCandidate ? (
    <div className="mt-3 space-y-2">
      <p>
        <span className="font-semibold text-white">
          ERL Score:
        </span>{" "}
        {enginePick!.score}/100
      </p>

      <p>
        <span className="font-semibold text-white">
          Engine Confidence:
        </span>{" "}
        {enginePick!.confidence}
      </p>

      <p>
        <span className="font-semibold text-white">
          Blowout Risk:
        </span>{" "}
        {enginePick!.blowoutRisk}
      </p>
    </div>
  ) : (
    <div className="mt-3 space-y-2">
      <p>
        <span className="font-semibold text-white">
          Status:
        </span>{" "}
        Not a qualified EasyRunLine candidate
      </p>

      <p className="text-zinc-300">
        This matchup did not satisfy the engine&apos;s underdog qualification
        rules. No score or rating was created.
      </p>

      <p>
        <span className="font-semibold text-white">
          ERL Score:
        </span>{" "}
        —
      </p>

      <p>
        <span className="font-semibold text-white">
          Engine Confidence:
        </span>{" "}
        —
      </p>

      <p>
        <span className="font-semibold text-white">
          Blowout Risk:
        </span>{" "}
        —
      </p>
    </div>
  )}

  <div className="mt-4 border-t border-yellow-500/20 pt-3">
    <p className="font-bold text-yellow-300">
      🏆 EasyRunLine Verdict
    </p>

    <p
      className={`mt-2 text-lg font-black ${
        engineVerdict === "PLAY"
          ? "text-green-400"
          : engineVerdict === "BORDERLINE"
            ? "text-yellow-300"
            : engineVerdict === "AVOID"
              ? "text-red-400"
              : "text-zinc-300"
      }`}
    >
      {engineVerdict === "PLAY"
        ? "🟢 PLAY"
        : engineVerdict === "BORDERLINE"
          ? "🟡 BORDERLINE"
          : engineVerdict === "AVOID"
            ? "🔴 AVOID"
            : "⚪ PASS"}
    </p>
  </div>
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
                    Explain EasyRunLine Decision
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