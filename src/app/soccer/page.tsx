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
  const [question, setQuestion] =
  useState("");

const [answer, setAnswer] =
  useState("");

const [questionLoading, setQuestionLoading] =
  useState(false);

const answerRef =
  useRef<HTMLDivElement | null>(null);
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
useEffect(() => {
  if (!answer) {
    return;
  }

  requestAnimationFrame(() => {
    answerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}, [answer]);
async function loadSoccerGames(competition: string) {
  setLoading(true);
  setError("");
  setGames([]);
  setQuestion("");
setAnswer("");
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

/*
 * Remove near-date duplicate fixtures returned as
 * separate event records by the odds provider.
 *
 * When the same home and away teams appear within
 * 14 days, retain the event supported by the largest
 * number of bookmakers.
 */
const duplicateWindowMs =
  14 * 24 * 60 * 60 * 1000;

const loadedGames: SoccerGame[] = [];

const gamesByKickoff = [...rawGames].sort(
  (a, b) =>
    new Date(a.commence_time).getTime() -
    new Date(b.commence_time).getTime()
);

for (const game of gamesByKickoff) {
  const homeTeam =
    game.home_team.trim().toLowerCase();

  const awayTeam =
    game.away_team.trim().toLowerCase();

  const kickoffTime = new Date(
    game.commence_time
  ).getTime();

  const duplicateIndex = loadedGames.findIndex(
    (existingGame) => {
      const sameMatchup =
        existingGame.home_team
          .trim()
          .toLowerCase() === homeTeam &&
        existingGame.away_team
          .trim()
          .toLowerCase() === awayTeam;

      if (!sameMatchup) {
        return false;
      }

      const existingKickoffTime = new Date(
        existingGame.commence_time
      ).getTime();

      return (
        Math.abs(
          kickoffTime - existingKickoffTime
        ) <= duplicateWindowMs
      );
    }
  );

  if (duplicateIndex === -1) {
    loadedGames.push(game);
    continue;
  }

  const existingGame =
    loadedGames[duplicateIndex];

  const currentBookmakerCount =
    game.bookmakers?.length ?? 0;

  const existingBookmakerCount =
    existingGame.bookmakers?.length ?? 0;

  if (
    currentBookmakerCount >
    existingBookmakerCount
  ) {
    loadedGames[duplicateIndex] = game;
  }
}

loadedGames.sort(
  (a, b) =>
    new Date(a.commence_time).getTime() -
    new Date(b.commence_time).getTime()
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
      setAnswer("");
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
    setAnswer("");
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
async function analyzeSoccerQuestion(
  customQuestion?: string
) {
  const finalQuestion =
    customQuestion?.trim() ||
    question.trim();

  if (!finalQuestion) {
    return;
  }
function analyzeSelectedSoccerGame(
  game: SoccerGame
) {
  const gameQuestion =
    `Analyze ${game.away_team} vs ${game.home_team}.`;

  setQuestion(gameQuestion);

  void analyzeSoccerQuestion(
    gameQuestion
  );
}
  const normalizedQuestion =
    finalQuestion.toLowerCase();

  setQuestionLoading(true);
  setAnswer("");

  try {
    const asksForUnder45 =
      normalizedQuestion.includes(
        "under 4.5"
      ) ||
      normalizedQuestion.includes(
        "under4.5"
      );
      const asksForSafestVerifiedMarket =
  normalizedQuestion.includes(
    "safest verified market"
  ) ||
  normalizedQuestion.includes(
    "safest available market"
  );
  

    const asksForHandicap =
      normalizedQuestion.includes(
        "handicap"
      ) ||
      normalizedQuestion.includes(
        "spread"
      );

    if (
  asksForUnder45 ||
  asksForSafestVerifiedMarket
) {
      await findSafestUnder45();

      setAnswer(
  `EasyRunLine reviewed the verified safety-oriented markets currently connected for ${selectedCompetition}. The highest-ranked available result is the Under 4.5 selection displayed below with its exact price, bookmaker, start time, relative market-safety ranking and matchup intelligence.`
);

      return;
    }

    if (asksForHandicap) {
      findSafestHandicap();

      setAnswer(
        `EasyRunLine checked the available positive-handicap markets for ${selectedCompetition}. A selection is displayed below only when it satisfies the engine's market and confidence requirements.`
      );

      return;
    }

    const selectedGame = games.find(
      (game) =>
        normalizedQuestion.includes(
          game.home_team.toLowerCase()
        ) &&
        normalizedQuestion.includes(
          game.away_team.toLowerCase()
        )
    );

    if (selectedGame) {
      const intelligence =
        getGameIntelligence(
          rankedGames,
          selectedGame.id
        );

      const h2h = getMarket(
        selectedGame,
        "h2h"
      );

      const spreads = getMarket(
        selectedGame,
        "spreads"
      );

      const totals = getMarket(
        selectedGame,
        "totals"
      );

      const homeMoneyline = getOutcome(
        h2h,
        selectedGame.home_team
      );

      const awayMoneyline = getOutcome(
        h2h,
        selectedGame.away_team
      );

      const drawMoneyline = getOutcome(
        h2h,
        "Draw"
      );

      const homeSpread = getOutcome(
        spreads,
        selectedGame.home_team
      );

      const awaySpread = getOutcome(
        spreads,
        selectedGame.away_team
      );

      const over = getOutcome(
        totals,
        "Over"
      );

      const under = getOutcome(
        totals,
        "Under"
      );

      const startDate = new Date(
        selectedGame.commence_time
      );

      setAnswer(
`══════════════════════════════
⚽ EASYRUNLINE SOCCER REPORT
══════════════════════════════

Competition:
${selectedCompetition}

Matchup:
${selectedGame.away_team} at ${selectedGame.home_team}

Local Start Time:
${startDate.toLocaleString()}

UTC Start Time:
${startDate.toISOString()}

━━━━━━━━━━━━━━━━━━━━━━

📊 ERL 1X2 Intelligence

Preferred Team:
${intelligence?.preferredTeam ?? "Not available"}

ERL 1X2 Score:
${intelligence ? `${intelligence.erlScore}/100` : "Not available"}

1X2 Confidence:
${intelligence?.confidence ?? "Not available"}

Matchup Grade:
${intelligence?.grade ?? "Not available"}

━━━━━━━━━━━━━━━━━━━━━━

💰 Visible Markets

Home Moneyline:
${selectedGame.home_team} ${formatPrice(homeMoneyline?.price)}

Draw:
${formatPrice(drawMoneyline?.price)}

Away Moneyline:
${selectedGame.away_team} ${formatPrice(awayMoneyline?.price)}

Home Spread:
${selectedGame.home_team} ${formatSpread(homeSpread)}

Away Spread:
${selectedGame.away_team} ${formatSpread(awaySpread)}

Total:
Over ${over?.point ?? "N/A"} at ${formatPrice(over?.price)}
Under ${under?.point ?? "N/A"} at ${formatPrice(under?.price)}

━━━━━━━━━━━━━━━━━━━━━━

🏆 Engine Status

${
  !intelligence
    ? "DATA LIMITED — No complete ERL intelligence is available."
    : intelligence.confidence === "Low"
      ? "PASS — The current ERL 1X2 confidence is Low."
      : "QUALIFIED FOR REVIEW — Verify the exact intended market and price before wagering."
}

━━━━━━━━━━━━━━━━━━━━━━

This report uses deterministic EasyRunLine data. It does not invent unavailable markets or prices.`
      );

      return;
    }

    setAnswer(
      `That question is not connected to a deterministic ${selectedCompetition} report yet. Ask for the safest Under 4.5, the safest handicap, or include both team names from a listed matchup.`
    );
  } catch (error) {
    console.error(
      "Soccer question error:",
      error
    );

    setAnswer(
      "Unable to complete the soccer question analysis."
    );
  } finally {
    setQuestionLoading(false);
  }
}
function analyzeSelectedSoccerGame(
  game: SoccerGame
) {
  const gameQuestion =
    `Analyze ${game.away_team} vs ${game.home_team}.`;

  setQuestion(gameQuestion);

  void analyzeSoccerQuestion(
    gameQuestion
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
      <div className="mt-8 rounded-2xl border border-yellow-500/30 bg-gray-950 p-4">
  <textarea
    value={question}
    onChange={(event) =>
      setQuestion(event.target.value)
    }
    className="h-28 w-full resize-none rounded-xl border border-gray-800 bg-black p-4 text-white outline-none transition focus:border-yellow-500"
    placeholder={`Ask EasyRunLine about ${selectedCompetition}: What is the safest Under 4.5?`}
  />

  <button
    type="button"
    onClick={() => {
  void analyzeSoccerQuestion();
}}
    disabled={
      questionLoading ||
      loading ||
      games.length === 0 ||
      !question.trim()
    }
    className="mt-4 w-full rounded-xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {questionLoading
      ? "Analyzing Soccer Question..."
      : "Analyze Soccer Question"}
  </button>
</div>

{answer && (
  <div
    ref={answerRef}
    className="mt-6 scroll-mt-6 whitespace-pre-line rounded-2xl border border-gray-800 bg-gray-950 p-6 text-left text-sm leading-7 text-gray-200"
  >
    {answer}
  </div>
)}
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
          Relative Market Safety Rank
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
    EasyRunLine Market Classification:{" "}
    {safestUnder45Pick.safetyScore >= 85
      ? "Highest Verified Market Protection"
      : safestUnder45Pick.safetyScore >= 70
        ? "Moderate Verified Market Protection"
        : "Limited Verified Market Protection"}
  </p>

  <p className="mt-2 text-sm leading-6 text-gray-300">
    EasyRunLine ranks Under{" "}
    {safestUnder45Pick.point} in{" "}
    {safestUnder45Pick.awayTeam} at{" "}
    {safestUnder45Pick.homeTeam} as the most protected
    verified Under 4.5 market currently identified in{" "}
    {selectedCompetition}. The exact market is available
    at {formatPrice(safestUnder45Pick.price)} with{" "}
    {safestUnder45Pick.bookmaker}.
  </p>

  <p className="mt-2 text-sm font-semibold text-white">
    Price Profile:{" "}
    <span
      className={
        safestUnder45Pick.price < 1.1
          ? "text-amber-400"
          : safestUnder45Pick.price < 1.25
            ? "text-yellow-400"
            : "text-emerald-400"
      }
    >
      {safestUnder45Pick.price < 1.1
        ? "Very Low Return"
        : safestUnder45Pick.price < 1.25
          ? "Low Return"
          : "Standard Return"}
    </span>
  </p>

  <p className="mt-2 text-xs leading-5 text-gray-500">
    The Relative Market Safety Rank compares this selection
    with the other verified Under 4.5 markets currently
    available in this competition. It is not a predicted
    probability, guarantee or claim of positive betting
    value. Always confirm the displayed line and price
    before placing a wager.
  </p>
</div>
</div>
)}

{safestUnder45Message &&
  !safestUnder45Pick && (
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
<button
  type="button"
  onClick={() =>
    analyzeSelectedSoccerGame(game)
  }
  disabled={questionLoading}
  className="mt-5 w-full rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
>
  {questionLoading
    ? "Analyzing..."
    : "Analyze Game"}
</button>
            </div>
            );
})}
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="mt-8 rounded-xl border border-gray-800 bg-gray-950 p-8 text-center text-gray-500">
          No currently available fixtures were returned for{" "}
{selectedCompetition}. Please check again when bookmaker
markets open.
        </div>
      )}
    </main>
  );
}