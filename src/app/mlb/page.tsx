"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import SportSelector from "@/components/SportSelector";
import {
  rankEasyRunLinePicks,
  getUnderdogPick,
  type ScoredPick,
} from "@/lib/erlScore";
import {
  rankF5Picks,
} from "@/lib/f5Score";
import Image from "next/image";
import {
  normalizeMLBAlternateTotals,
  rankMLBAlternateTotals,
  getCombinedRunsFromRecentGames,
  getCombinedRunsFromH2H,
  type AlternateTotalGame,
  type NormalizedAlternateTotal,
  type MLBAlternateTotalContext,
  type ScoredAlternateTotal,
} from "@/lib/mlb/mlbAlternateTotal";
import {
  normalizeMLBF5Totals,
  rankMLBF5Totals,
  getCombinedRunsFromRecentF5Games,
  getCombinedRunsFromF5H2H,
  type F5TotalGame,
  type F5TotalContext,
  type ScoredF5Total,
} from "@/lib/mlb/mlbF5Total";
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
  gamesCounted: number;

  runsScoredLast10: number;
  runsAllowedLast10: number;
  runDifferentialLast10: number;

  averageRunsScored: number;
  averageRunsAllowed: number;

  plus45CoversLast10: number;
  plus45FailuresLast10: number;
  plus45CoverRecord: string;
  plus45CoverRate: number;

  blowoutLossesLast10: number;

  streakType: "W" | "L" | null;
  streakLength: number;
  streak: string;
  recentGames?: {
  runsScored: number;
  runsAllowed: number;
  combinedRuns: number;
  venue: "Home" | "Away";
}[];
};

type H2HTeamSummary = {
  team: string;
  gamesCounted: number;

  plus45Covers: number;
  plus45Failures: number;
  plus45CoverRecord: string;
  plus45CoverRate: number;

  blowoutLosses: number;

  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  averageRunDifferential: number;
};

type H2HResponse = {
  status?: string;
  meetingsCounted?: number;

  teams?: {
    home?: H2HTeamSummary;
    away?: H2HTeamSummary;
  };

  error?: string;
  meetings?: {
  awayScore: number;
  homeScore: number;
}[];
};
type F5TeamForm = {
  team: string;
  gamesCounted: number;

  winsF5Last10: number;
  lossesF5Last10: number;
  tiesF5Last10: number;
  f5Record: string;

  runsScoredF5Last10: number;
  runsAllowedF5Last10: number;
  runDifferentialF5Last10: number;

  averageRunsScoredF5: number;
  averageRunsAllowedF5: number;


  recentF5Games?: {
  runsScored: number;
  runsAllowed: number;
  combinedRuns: number;
  venue: "Home" | "Away";
}[];

  plus25CoversF5Last10: number;
  plus25FailuresF5Last10: number;
  plus25CoverRecordF5: string;
  plus25CoverRateF5: number;

  earlyBlowoutLossesF5Last10: number;

  homeF5: {
    games: number;
    plus25Covers: number;
  };

  awayF5: {
    games: number;
    plus25Covers: number;
  };
};

type F5H2HTeamSummary = {
  team: string;
  gamesCounted: number;

  plus25CoversF5: number;
  plus25FailuresF5: number;
  plus25CoverRecordF5: string;
  plus25CoverRateF5: number;

  earlyBlowoutLossesF5: number;

  runsScoredF5: number;
  runsAllowedF5: number;
  runDifferentialF5: number;

  averageRunDifferentialF5: number;
  averageRunsScoredF5: number;
  averageRunsAllowedF5: number;
};

type F5H2HResponse = {
  status?: string;
  meetingsCounted?: number;

  meetings?: {
    gamePk: number;
    gameDate: string;
    awayTeam: string;
    homeTeam: string;
    awayF5Score: number;
    homeF5Score: number;
  }[];

  teams?: {
    home?: F5H2HTeamSummary;
    away?: F5H2HTeamSummary;
  };

  error?: string;
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

homeRunsScoredLast10?: number;
awayRunsScoredLast10?: number;

homeRunsAllowedLast10?: number;
awayRunsAllowedLast10?: number;

homeRunDifferentialLast10?: number;
awayRunDifferentialLast10?: number;

homeAverageRunsScored?: number;
awayAverageRunsScored?: number;

homeAverageRunsAllowed?: number;
awayAverageRunsAllowed?: number;

homePlus45CoversLast10?: number;
awayPlus45CoversLast10?: number;

homePlus45FailuresLast10?: number;
awayPlus45FailuresLast10?: number;

homePlus45CoverRate?: number;
awayPlus45CoverRate?: number;

homeBlowoutLossesLast10?: number;
awayBlowoutLossesLast10?: number;

homeRecentStreak?: string;
awayRecentStreak?: string;
h2hMeetingsCounted?: number;





homeH2HPlus45Covers?: number;
homeH2HPlus45Failures?: number;
homeH2HPlus45CoverRecord?: string;
homeH2HPlus45CoverRate?: number;
homeH2HBlowoutLosses?: number;
homeH2HAverageRunDifferential?: number;

awayH2HPlus45Covers?: number;
awayH2HPlus45Failures?: number;
awayH2HPlus45CoverRecord?: string;
awayH2HPlus45CoverRate?: number;
awayH2HBlowoutLosses?: number;
awayH2HAverageRunDifferential?: number;
homeF5GamesCounted?: number;
awayF5GamesCounted?: number;

homeF5Record?: string;
awayF5Record?: string;

homeRunsScoredF5Last10?: number;
awayRunsScoredF5Last10?: number;

homeRunsAllowedF5Last10?: number;
awayRunsAllowedF5Last10?: number;

homeRunDifferentialF5Last10?: number;
awayRunDifferentialF5Last10?: number;

homeAverageRunsScoredF5?: number;
awayAverageRunsScoredF5?: number;

homeAverageRunsAllowedF5?: number;
awayAverageRunsAllowedF5?: number;

homePlus25CoversF5Last10?: number;
awayPlus25CoversF5Last10?: number;

homePlus25FailuresF5Last10?: number;
awayPlus25FailuresF5Last10?: number;

homePlus25CoverRateF5?: number;
awayPlus25CoverRateF5?: number;

homeEarlyBlowoutLossesF5Last10?: number;
awayEarlyBlowoutLossesF5Last10?: number;

homeVenueF5Games?: number;
awayVenueF5Games?: number;

homeVenuePlus25CoversF5?: number;
awayVenuePlus25CoversF5?: number;

f5H2HMeetingsCounted?: number;

homeF5H2HPlus25Covers?: number;
awayF5H2HPlus25Covers?: number;

homeF5H2HPlus25Failures?: number;
awayF5H2HPlus25Failures?: number;

homeF5H2HPlus25CoverRecord?: string;
awayF5H2HPlus25CoverRecord?: string;

homeF5H2HPlus25CoverRate?: number;
awayF5H2HPlus25CoverRate?: number;





homeF5H2HRunDifferential?: number;
awayF5H2HRunDifferential?: number;

homeF5H2HAverageRunDifferential?: number;
awayF5H2HAverageRunDifferential?: number;

homeF5H2HEarlyBlowoutLosses?: number;
awayF5H2HEarlyBlowoutLosses?: number;
homeBullpenERA?: number;
awayBullpenERA?: number;
homeBullpenRank?: number;
awayBullpenRank?: number;
  bookmakers?: Bookmaker[];

  h2hMeetings?: {
  awayScore: number;
  homeScore: number;
}[];
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

const [
  alternateTotalGames,
  setAlternateTotalGames,
] = useState<AlternateTotalGame[]>([]);
const [
  rankedAlternateTotals,
  setRankedAlternateTotals,
] = useState<ScoredAlternateTotal[]>([]);

const [
  f5TotalGames,
  setF5TotalGames,
] = useState<F5TotalGame[]>([]);

const [
  rankedF5Totals,
  setRankedF5Totals,
] = useState<ScoredF5Total[]>([]);



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
async function loadMLBAlternateTotals() {
  try {
    const response = await fetch(
      "/api/mlb-alternate-totals"
    );

    if (!response.ok) {
      return [];
    }

    const data =
      await response.json();

    return (
      data.games || []
    ) as AlternateTotalGame[];
  } catch {
    return [];
  }
}
async function loadMLBF5AlternateTotals() {
  try {
    const response = await fetch(
      "/api/mlb-f5-alternate-totals"
    );

    if (!response.ok) {
      return [];
    }

    const data =
      await response.json();

    return (
      data.games || []
    ) as F5TotalGame[];
  } catch {
    return [];
  }
}

function buildAlternateTotalContext(
  candidate: NormalizedAlternateTotal,
  games: Game[],
  teamForm: TeamForm[]
): MLBAlternateTotalContext {
  const game = games.find(
    (item) =>
      item.home_team ===
        candidate.homeTeam &&
      item.away_team ===
        candidate.awayTeam
  );

  const homeForm = teamForm.find(
    (team) =>
      team.team ===
      candidate.homeTeam
  );

  const awayForm = teamForm.find(
    (team) =>
      team.team ===
      candidate.awayTeam
  );

  return {
    recentCombinedRunsHome:
      getCombinedRunsFromRecentGames(
        homeForm?.recentGames
      ),

    recentCombinedRunsAway:
      getCombinedRunsFromRecentGames(
        awayForm?.recentGames
      ),

    h2hCombinedRuns:
      getCombinedRunsFromH2H(
        game?.h2hMeetings
      ),

    homeStarterERA:
      game?.homeERA ?? null,

    awayStarterERA:
      game?.awayERA ?? null,

    homeBullpenERA:
      game?.homeBullpenERA ??
      null,

    awayBullpenERA:
      game?.awayBullpenERA ??
      null,
  };
}

async function loadTeamForm() {
  const response = await fetch("/api/mlb-form");
  const data = await response.json();

  return (data.teams || []) as TeamForm[];
}
async function loadF5TeamForm() {
  try {
    const response = await fetch(
      "/api/mlb-f5-form"
    );

    if (!response.ok) {
      return [];
    }

    const data =
      await response.json();

    return (
      data.teams || []
    ) as F5TeamForm[];
  } catch {
    return [];
  }
}
async function loadBullpenData() {
  const response = await fetch("/api/mlb-bullpen");
  const data = await response.json();

  return (data.bullpens || []) as BullpenTeam[];
}
async function loadH2HData(
  game: Game
): Promise<H2HResponse | null> {
  try {
    const response = await fetch(
      `/api/mlb-h2h?homeTeam=${encodeURIComponent(
        game.home_team
      )}&awayTeam=${encodeURIComponent(
        game.away_team
      )}`
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as
      H2HResponse;
  } catch {
    return null;
  }
}
async function loadF5H2HData(
  game: Game
): Promise<F5H2HResponse | null> {
  try {
    const response = await fetch(
      `/api/mlb-f5-h2h?homeTeam=${encodeURIComponent(
        game.home_team
      )}&awayTeam=${encodeURIComponent(
        game.away_team
      )}`
    );

    if (!response.ok) {
      return null;
    }

    return (
      await response.json()
    ) as F5H2HResponse;
  } catch {
    return null;
  }
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
      
      const probables =
  await loadProbablePitchers();

const teamForm =
  await loadTeamForm();

const f5TeamForm =
  await loadF5TeamForm();

const bullpenData =
  await loadBullpenData();
const alternateTotals =
  await loadMLBAlternateTotals();

setAlternateTotalGames(
  alternateTotals
);
const f5AlternateTotals =
  await loadMLBF5AlternateTotals();

setF5TotalGames(
  f5AlternateTotals
);

const gamesWithLiveData = await Promise.all(
  (data.games || []).map(async (game: Game) => {
  const probable = probables.find(
    (p) =>
      p.homeTeam === game.home_team &&
      p.awayTeam === game.away_team
      
  );

  const homeForm = teamForm.find((team) => team.team === game.home_team);
  const awayForm = teamForm.find((team) => team.team === game.away_team);
  const homeF5Form =
  f5TeamForm.find(
    (team) =>
      team.team ===
      game.home_team
  );

const awayF5Form =
  f5TeamForm.find(
    (team) =>
      team.team ===
      game.away_team
  );

  const homeBullpen = bullpenData.find(
    (team) => team.team === game.home_team
  );

  const awayBullpen = bullpenData.find(
    (team) => team.team === game.away_team
  );
  const h2hData =
  await loadH2HData(game);
  const f5H2HData =
  await loadF5H2HData(game);

const homeH2H =
  h2hData?.teams?.home;

const awayH2H =
  h2hData?.teams?.away;
  const homeF5H2H =
  f5H2HData?.teams?.home;

const awayF5H2H =
  f5H2HData?.teams?.away;

  return {
    ...game,

    homePitcher: probable?.homePitcher,
    awayPitcher: probable?.awayPitcher,
    homeERA: probable?.homeERA ?? undefined,
    awayERA: probable?.awayERA ?? undefined,

    homeLast10Wins:
  homeForm?.winsLast10,

homeLast10Losses:
  homeForm?.lossesLast10,

awayLast10Wins:
  awayForm?.winsLast10,

awayLast10Losses:
  awayForm?.lossesLast10,

homeRunsScoredLast10:
  homeForm?.runsScoredLast10,

awayRunsScoredLast10:
  awayForm?.runsScoredLast10,

homeRunsAllowedLast10:
  homeForm?.runsAllowedLast10,

awayRunsAllowedLast10:
  awayForm?.runsAllowedLast10,

homeRunDifferentialLast10:
  homeForm?.runDifferentialLast10,

awayRunDifferentialLast10:
  awayForm?.runDifferentialLast10,

homeAverageRunsScored:
  homeForm?.averageRunsScored,

awayAverageRunsScored:
  awayForm?.averageRunsScored,

homeAverageRunsAllowed:
  homeForm?.averageRunsAllowed,

awayAverageRunsAllowed:
  awayForm?.averageRunsAllowed,

homePlus45CoversLast10:
  homeForm?.plus45CoversLast10,

awayPlus45CoversLast10:
  awayForm?.plus45CoversLast10,

homePlus45FailuresLast10:
  homeForm?.plus45FailuresLast10,

awayPlus45FailuresLast10:
  awayForm?.plus45FailuresLast10,

homePlus45CoverRate:
  homeForm?.plus45CoverRate,

awayPlus45CoverRate:
  awayForm?.plus45CoverRate,

homeBlowoutLossesLast10:
  homeForm?.blowoutLossesLast10,

awayBlowoutLossesLast10:
  awayForm?.blowoutLossesLast10,

homeRecentStreak:
  homeForm?.streak,

awayRecentStreak:
  awayForm?.streak,
  h2hMeetingsCounted:
  h2hData?.meetingsCounted,
  h2hMeetings:
  h2hData?.meetings ?? [],

  

homeH2HPlus45Covers:
  homeH2H?.plus45Covers,

homeH2HPlus45Failures:
  homeH2H?.plus45Failures,

homeH2HPlus45CoverRecord:
  homeH2H?.plus45CoverRecord,

homeH2HPlus45CoverRate:
  homeH2H?.plus45CoverRate,

homeH2HBlowoutLosses:
  homeH2H?.blowoutLosses,

homeH2HAverageRunDifferential:
  homeH2H?.averageRunDifferential,

awayH2HPlus45Covers:
  awayH2H?.plus45Covers,

awayH2HPlus45Failures:
  awayH2H?.plus45Failures,

awayH2HPlus45CoverRecord:
  awayH2H?.plus45CoverRecord,

awayH2HPlus45CoverRate:
  awayH2H?.plus45CoverRate,

awayH2HBlowoutLosses:
  awayH2H?.blowoutLosses,

awayH2HAverageRunDifferential:
  awayH2H?.averageRunDifferential,
homeF5GamesCounted:
  homeF5Form?.gamesCounted,

awayF5GamesCounted:
  awayF5Form?.gamesCounted,

homeF5Record:
  homeF5Form?.f5Record,

awayF5Record:
  awayF5Form?.f5Record,

homeRunsScoredF5Last10:
  homeF5Form?.runsScoredF5Last10,

awayRunsScoredF5Last10:
  awayF5Form?.runsScoredF5Last10,

homeRunsAllowedF5Last10:
  homeF5Form?.runsAllowedF5Last10,

awayRunsAllowedF5Last10:
  awayF5Form?.runsAllowedF5Last10,

homeRunDifferentialF5Last10:
  homeF5Form?.runDifferentialF5Last10,

awayRunDifferentialF5Last10:
  awayF5Form?.runDifferentialF5Last10,

homeAverageRunsScoredF5:
  homeF5Form?.averageRunsScoredF5,

awayAverageRunsScoredF5:
  awayF5Form?.averageRunsScoredF5,

homeAverageRunsAllowedF5:
  homeF5Form?.averageRunsAllowedF5,

awayAverageRunsAllowedF5:
  awayF5Form?.averageRunsAllowedF5,

homePlus25CoversF5Last10:
  homeF5Form?.plus25CoversF5Last10,

awayPlus25CoversF5Last10:
  awayF5Form?.plus25CoversF5Last10,

homePlus25FailuresF5Last10:
  homeF5Form?.plus25FailuresF5Last10,

awayPlus25FailuresF5Last10:
  awayF5Form?.plus25FailuresF5Last10,

homePlus25CoverRateF5:
  homeF5Form?.plus25CoverRateF5,

awayPlus25CoverRateF5:
  awayF5Form?.plus25CoverRateF5,

homeEarlyBlowoutLossesF5Last10:
  homeF5Form?.earlyBlowoutLossesF5Last10,

awayEarlyBlowoutLossesF5Last10:
  awayF5Form?.earlyBlowoutLossesF5Last10,

homeVenueF5Games:
  homeF5Form?.homeF5.games,

homeVenuePlus25CoversF5:
  homeF5Form?.homeF5.plus25Covers,

awayVenueF5Games:
  awayF5Form?.awayF5.games,

awayVenuePlus25CoversF5:
  awayF5Form?.awayF5.plus25Covers,

f5H2HMeetingsCounted:
  f5H2HData?.meetingsCounted,

  f5H2HMeetings:
  f5H2HData?.meetings ?? [],







homeF5H2HPlus25Covers:
  homeF5H2H?.plus25CoversF5,

awayF5H2HPlus25Covers:
  awayF5H2H?.plus25CoversF5,

homeF5H2HPlus25Failures:
  homeF5H2H?.plus25FailuresF5,

awayF5H2HPlus25Failures:
  awayF5H2H?.plus25FailuresF5,

homeF5H2HPlus25CoverRecord:
  homeF5H2H?.plus25CoverRecordF5,

awayF5H2HPlus25CoverRecord:
  awayF5H2H?.plus25CoverRecordF5,

homeF5H2HPlus25CoverRate:
  homeF5H2H?.plus25CoverRateF5,

awayF5H2HPlus25CoverRate:
  awayF5H2H?.plus25CoverRateF5,

homeF5H2HRunDifferential:
  homeF5H2H?.runDifferentialF5,

awayF5H2HRunDifferential:
  awayF5H2H?.runDifferentialF5,

homeF5H2HAverageRunDifferential:
  homeF5H2H?.averageRunDifferentialF5,

awayF5H2HAverageRunDifferential:
  awayF5H2H?.averageRunDifferentialF5,

homeF5H2HEarlyBlowoutLosses:
  homeF5H2H?.earlyBlowoutLossesF5,

awayF5H2HEarlyBlowoutLosses:
  awayF5H2H?.earlyBlowoutLossesF5,
    homeBullpenERA: homeBullpen?.bullpenERA ?? undefined,
    awayBullpenERA: awayBullpen?.bullpenERA ?? undefined,
    homeBullpenRank: homeBullpen?.bullpenRank ?? undefined,
    awayBullpenRank: awayBullpen?.bullpenRank ?? undefined,
    };
  })
);

const normalizedAlternateTotals =
  normalizeMLBAlternateTotals(
    alternateTotals
  );
  console.log("Reached ranking engine");

const calculatedAlternateTotals =
  rankMLBAlternateTotals(
    normalizedAlternateTotals,
    (
      candidate
    ): MLBAlternateTotalContext => {
      const matchingGame =
        gamesWithLiveData.find(
          (game) =>
            game.home_team ===
              candidate.homeTeam &&
            game.away_team ===
              candidate.awayTeam
        );

      const homeForm =
        teamForm.find(
          (team) =>
            team.team ===
            candidate.homeTeam
        );

      const awayForm =
        teamForm.find(
          (team) =>
            team.team ===
            candidate.awayTeam
        );

      return {
        recentCombinedRunsHome:
          getCombinedRunsFromRecentGames(
            homeForm?.recentGames
          ),

        recentCombinedRunsAway:
          getCombinedRunsFromRecentGames(
            awayForm?.recentGames
          ),

        h2hCombinedRuns:
          getCombinedRunsFromH2H(
            matchingGame?.h2hMeetings
          ),

        homeStarterERA:
          matchingGame?.homeERA ??
          null,

        awayStarterERA:
          matchingGame?.awayERA ??
          null,

        homeBullpenERA:
          matchingGame?.homeBullpenERA ??
          null,

        awayBullpenERA:
          matchingGame?.awayBullpenERA ??
          null,
      };
    }
  );

console.log(
  "⚾ FULL GAME MLB ALTERNATE TOTALS — TOP 15"
);

console.table(
  calculatedAlternateTotals
    .slice(0, 15)
    .map((total) => ({
      Matchup:
        `${total.awayTeam} @ ${total.homeTeam}`,

      Pick:
        `${total.direction} ${total.line}`,

      Price:
        total.bestPrice,

      Score:
        total.score,

      Verdict:
        total.verdict,

      HomeRecord:
        total.recentHome.record,

      AwayRecord:
        total.recentAway.record,

      H2HRecord:
        total.h2h.record,
    }))
);
setRankedAlternateTotals(
  calculatedAlternateTotals
);

const normalizedF5Totals =
  normalizeMLBF5Totals(
    f5AlternateTotals
  );

const calculatedF5Totals =
  rankMLBF5Totals(
    normalizedF5Totals,
    (
      candidate
    ): F5TotalContext => {
      const matchingGame =
        gamesWithLiveData.find(
          (game) =>
            game.home_team ===
              candidate.homeTeam &&
            game.away_team ===
              candidate.awayTeam
        );

      const homeF5Form =
        f5TeamForm.find(
          (team) =>
            team.team ===
            candidate.homeTeam
        );

      const awayF5Form =
        f5TeamForm.find(
          (team) =>
            team.team ===
            candidate.awayTeam
        );

      return {
        recentCombinedRunsHome:
          getCombinedRunsFromRecentF5Games(
            homeF5Form?.recentF5Games
          ),

        recentCombinedRunsAway:
          getCombinedRunsFromRecentF5Games(
            awayF5Form?.recentF5Games
          ),

        h2hCombinedRuns:
          getCombinedRunsFromF5H2H(
            matchingGame?.f5H2HMeetings
          ),

        homeStarterERA:
          matchingGame?.homeERA ??
          null,

        awayStarterERA:
          matchingGame?.awayERA ??
          null,
      };
    }
  );

  console.table(
  calculatedF5Totals
    .slice(0, 15)
    .map((total) => ({
      Matchup:
        `${total.awayTeam} @ ${total.homeTeam}`,

      Pick:
        `${total.direction} ${total.line}`,

      Price:
        total.bestPrice,

      Score:
        total.score,

      Verdict:
        total.verdict,

      HomeRecent:
        total.factors.homeRecent,

      AwayRecent:
        total.factors.awayRecent,

      H2H:
        total.factors.h2h,

      StartingPitching:
        total.factors.startingPitching,

      Bookmakers:
        total.factors.bookmakerConsensus,

      PriceQuality:
        total.factors.priceQuality,

      HomeRecord:
        total.recentHome.record,

      AwayRecord:
        total.recentAway.record,

      H2HRecord:
        total.h2h.record,
    }))
);

setRankedF5Totals(
  calculatedF5Totals
);

console.table(
  calculatedF5Totals
    .slice(0, 15)
    .map((total) => ({
      Matchup:
        `${total.awayTeam} @ ${total.homeTeam}`,

      Pick:
        `${total.direction} ${total.line}`,

      Price:
        total.bestPrice,

      Score:
        total.score,

      Verdict:
        total.verdict,

      HomeRecord:
        total.recentHome.record,

      AwayRecord:
        total.recentAway.record,

      H2HRecord:
        total.h2h.record,
    }))
);

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
  const selectionHeading =
  enginePick.verdict === "PASS"
    ? "🎯 Evaluated +4.5 Side"
    : "🎯 Recommended +4.5 Side";

const reasonsHeading =
  enginePick.verdict === "PASS"
    ? "🧠 Why EasyRunLine Passed"
    : "🧠 Why This Play";
    const marketVerificationClosing =
  enginePick.verdict === "PASS"
    ? "This matchup remains an EasyRunLine PASS regardless of market availability."
    : "Verify that your sportsbook offers the recommended +4.5 line at an acceptable price. If the line is unavailable, the wagering action is PASS.";

const gameQuestion = `
Create an EasyRunLine AI report explaining the engine decision for this MLB matchup.

IMPORTANT:
This matchup has already been evaluated by the EasyRunLine fixed scoring engine.
Do not perform a separate evaluation.
Do not change the selected underdog.
Do not recommend the favorite +4.5.
Do not replace the EasyRunLine +4.5 target with the standard +1.5 line.
When the supplied verdict is PASS, never use the words "playable", "recommended", "suitable for wagering", "favorable cover outlook", or "positive play" to describe the selection.
Describe its supporting evidence as positive historical evidence that was overridden by the identified risks.

Use the supplied ERL Score exactly as written.
Use the supplied Engine Confidence exactly as written.
Use the supplied Blowout Risk exactly as written.
Use the supplied Engine Verdict exactly as written.
Use the supplied Verdict Reason exactly as written.

Do not upgrade, downgrade, average, reinterpret, or replace any engine rating or verdict.
The fixed engine verdict is authoritative.
Do not change STRONG PLAY into PLAY, LEAN, or PASS.
Do not change PLAY into LEAN or PASS.
Do not create a different verdict because the exact +4.5 price is not present in the visible feed.

Do not invent a numerical cover probability or unsupported percentage.
Use the heading "🛡 Cover Outlook".

Use confident but evidence-based language.
Never use "guaranteed", "certain", "minimal chance", "almost certain", "cannot lose", "comfortably cover", or "lock".
Engine Confidence is a model classification, not statistical certainty.
Describe Blowout Risk comparatively rather than as an exact probability.

For STRONG PLAY, clearly explain the strongest supplied supporting evidence.
For PASS, do not call the selection recommended, playable, suitable for wagering, or a positive play.

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

${selectionHeading}

${enginePick.team} +4.5 vs ${enginePick.opponent}
Game Date and Time:
Local: ${localStartTime}
UTC: ${utcStartTime} UTC

${enginePick.team} — ERL Score: ${enginePick.score}/100 — Engine Confidence: ${enginePick.confidence} — Blowout Risk: ${enginePick.blowoutRisk}

Engine Verdict: ${enginePick.verdict}
Verdict Reason: ${enginePick.verdictReason}

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

💰 Market Verification

Explain what the visible market confirms and what remains unverified.
Do not claim betting value without the exact +4.5 price.
Do not let missing +4.5 pricing change the supplied Engine Verdict.
Remind the user to verify the alternate +4.5 line and price.
If the sportsbook does not offer +4.5, the wagering action is PASS.
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

${reasonsHeading}

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

Reproduce this supplied Engine Verdict exactly:

${enginePick.verdict}

Authoritative Verdict Reason:
${enginePick.verdictReason}

  Explain why the supplied score, confidence, blowout risk and engine reasons support this verdict.

If the verdict is PASS, explain which risks override the positive evidence. Acknowledge positive evidence without describing the selection as recommended.

If the verdict is STRONG PLAY, explain why the combined +4.5 history and current matchup evidence justify strong model conviction without presenting the result as certain.

When the verdict is STRONG PLAY, use confident but evidence-based language. Clearly identify the recent +4.5 record, H2H +4.5 record, run-differential profile, pitching matchup and bullpen comparison when those details are supplied.

Do not invent statistics or claim that the selection is guaranteed.

End every PLAY, STRONG PLAY, CAUTIOUS PLAY, or LEAN verdict with:

${marketVerificationClosing}

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

function buildMLBAlternateTotalsReport(
  selections: ScoredAlternateTotal[]
) {
  const divider =
    "━━━━━━━━━━━━━━━━━━━━━━";

  const confidenceFromScore = (
    score: number
  ) => {
    if (score >= 90) {
      return "Very High";
    }

    if (score >= 80) {
      return "High";
    }

    if (score >= 70) {
      return "Moderate";
    }

    return "Low";
  };

  const formatLocalDate = (
    value: string
  ) => {
    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not supplied";
    }

    return date.toLocaleString();
  };

  const formatUTCDate = (
    value: string
  ) => {
    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Not supplied";
    }

    return date.toUTCString();
  };

  const selectionBlocks =
    selections
      .map(
        (
          total,
          index
        ) => {
          const confidence =
            confidenceFromScore(
              total.score
            );

          return `${index + 1}. ${total.awayTeam} vs ${total.homeTeam}

Selection:
${total.direction} ${total.line}

Game Date and Time:
Local: ${formatLocalDate(
            total.commenceTime
          )}
UTC: ${formatUTCDate(
            total.commenceTime
          )}

EasyRunLine Total Score:
${total.score}/100

Engine Confidence:
${confidence}

Engine Verdict:
${total.verdict}

Best Available Price:
${total.bestPrice}

Bookmaker:
${total.bookmaker}`;
        }
      )
      .join(
        `\n\n${divider}\n\n`
      );

  const confidenceBlocks =
    selections
      .map(
        (
          total,
          index
        ) => {
          const confidence =
            confidenceFromScore(
              total.score
            );

          return `${index + 1}. ${total.awayTeam} vs ${total.homeTeam}

Engine Confidence: ${confidence}

A ${confidence} confidence rating reflects the strength and agreement of the available recent scoring, H2H, pitching, bullpen and market evidence supporting ${total.direction} ${total.line}.`;
        }
      )
      .join("\n\n");

  const scoringOutlook =
    selections
      .map(
        (
          total,
          index
        ) => {
          return `${index + 1}. ${total.awayTeam} vs ${total.homeTeam}

${total.direction} ${total.line}


Home Recent Record (${total.direction} ${total.line})
${total.recentHome.wins} ${
  total.recentHome.wins === 1
    ? "Win"
    : "Wins"
} • ${total.recentHome.losses} ${
  total.recentHome.losses === 1
    ? "Loss"
    : "Losses"
} • ${total.recentHome.pushes} ${
  total.recentHome.pushes === 1
    ? "Push"
    : "Pushes"
}
Hit Rate: ${total.recentHome.hitRate}%

Away Recent Record (${total.direction} ${total.line})
${total.recentAway.wins} ${
  total.recentAway.wins === 1
    ? "Win"
    : "Wins"
} • ${total.recentAway.losses} ${
  total.recentAway.losses === 1
    ? "Loss"
    : "Losses"
} • ${total.recentAway.pushes} ${
  total.recentAway.pushes === 1
    ? "Push"
    : "Pushes"
}
Hit Rate: ${total.recentAway.hitRate}%

Head-to-Head Record (${total.direction} ${total.line})
${total.h2h.wins} ${
  total.h2h.wins === 1
    ? "Win"
    : "Wins"
} • ${total.h2h.losses} ${
  total.h2h.losses === 1
    ? "Loss"
    : "Losses"
} • ${total.h2h.pushes} ${
  total.h2h.pushes === 1
    ? "Push"
    : "Pushes"
}
Hit Rate: ${total.h2h.hitRate}%

Home Recent Average Combined Runs:
${total.recentHome.averageCombinedRuns}

Away Recent Average Combined Runs:
${total.recentAway.averageCombinedRuns}

Head-to-Head Average Combined Runs:
${total.h2h.averageCombinedRuns}`;

        }
      )
      .join("\n\n");

  const pitchingBlocks =
  selections
    .map(
      (
        total,
        index
      ) => {
        return `${index + 1}. ${total.awayTeam} vs ${total.homeTeam}

Starting-Pitching Score:
${total.factors.startingPitching}/15

This factor measures whether the starting-pitching profile supports the selected ${total.direction} direction.`;
      }
    )
    .join("\n\n");

  const bullpenBlocks =
  selections
    .map(
      (
        total,
        index
      ) => {
        return `${index + 1}. ${total.awayTeam} vs ${total.homeTeam}

Bullpen Score:
${total.factors.bullpen}/10

This factor measures whether the bullpen profile supports the selected ${total.direction} direction.`;
      }
    )
    .join("\n\n");

    const marketBlocks =
  selections
    .map(
      (
        total,
        index
      ) => {
        return `${index + 1}. ${total.awayTeam} vs ${total.homeTeam}

Selection:
${total.direction} ${total.line}

Best Price:
${total.bestPrice}

Best Bookmaker:
${total.bookmaker}

Supporting Bookmakers:
${total.supportingBookmakers}

Bookmaker Consensus Score:
${total.factors.bookmakerConsensus}/10

Price Quality Score:
${total.factors.priceQuality}/5`;
      }
    )
    .join("\n\n");

  const whyBlocks =
    selections
      .map(
        (
          total,
          index
        ) => {
          return `${index + 1}. ${total.awayTeam} vs ${total.homeTeam}

• Qualified EasyRunLine ${total.direction} ${total.line} alternate-total candidate
• Overall Total Score: ${total.score}/100
• Engine Verdict: ${total.verdict}
• Home Recent Record (${total.direction} ${total.line}):
  ${total.recentHome.wins} Wins • ${total.recentHome.losses} Losses • ${total.recentHome.pushes} ${total.recentHome.pushes === 1 ? "Push" : "Pushes"}

• Hit Rate: ${total.recentHome.hitRate}%

• Away Recent Record (${total.direction} ${total.line}):
  ${total.recentAway.wins} Wins • ${total.recentAway.losses} Losses • ${total.recentAway.pushes} ${total.recentAway.pushes === 1 ? "Push" : "Pushes"}

• Hit Rate: ${total.recentAway.hitRate}%

• Head-to-Head Record (${total.direction} ${total.line}):
  ${total.h2h.wins} Wins • ${total.h2h.losses} Losses • ${total.h2h.pushes} ${total.h2h.pushes === 1 ? "Push" : "Pushes"}

• Hit Rate: ${total.h2h.hitRate}%
• Starting-pitching factor: ${total.factors.startingPitching}/15
• Bullpen factor: ${total.factors.bullpen}/10
• Market consensus factor: ${total.factors.bookmakerConsensus}/10
• Price-quality factor: ${total.factors.priceQuality}/5
• Best available price: ${total.bestPrice} at ${total.bookmaker}`;
        }
      )
      .join("\n\n");

  const verdictBlocks =
    selections
      .map(
        (
          total,
          index
        ) => {
          const confidence =
            confidenceFromScore(
              total.score
            );

          return `${index + 1}. ${total.awayTeam} vs ${total.homeTeam}

Selection:
${total.direction} ${total.line}

Engine Verdict:
${total.verdict}

EasyRunLine Total Score:
${total.score}/100

Engine Confidence:
${confidence}

The verdict reflects the combined recent scoring profile, H2H total history, starting-pitching environment, bullpen environment, bookmaker support and available market price.

If the displayed alternate line or price is no longer available at your sportsbook, do not force the selection.`;
        }
      )
      .join("\n\n");

  return `══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

🔥 Safest MLB Alternate Totals

${selectionBlocks}

${divider}

📊 Individual Confidence

${confidenceBlocks}

${divider}

⚾ Full-Game Scoring Outlook

${scoringOutlook}

${divider}

⚾ Starting Pitching Assessment

${pitchingBlocks}

${divider}

🔥 Bullpen Assessment

${bullpenBlocks}

${divider}

💰 Market Verification

These selections use live alternate-total markets returned by the connected sportsbook feed.

Always verify that the exact ${selections
    .map(
      (total) =>
        `${total.direction} ${total.line}`
    )
    .join(
      " and "
    )} line and displayed price remain available before placing a wager.

Market movement may change the available line or price without changing the historical matchup data.

${divider}

📖 Visible Market Details

${marketBlocks}

${divider}

🧠 Why These Alternate Total Selections

${whyBlocks}

${divider}

⚠ Important Limitations

Weather: Not currently included in this total score.
Confirmed batting lineups: Not currently included.
Market prices can move after the EasyRunLine analysis is generated.
Historical performance supports analysis but does not guarantee the next result.

${divider}

🏆 EasyRunLine Individual Total Verdicts

${verdictBlocks}

${divider}

📌 EasyRunLine Rule

One Unit Only.
Never chase losses.
Never call anything a lock.
Verify every exact alternate total line and price independently.
If the recommended line is unavailable or changes materially, PASS rather than forcing the wager.`;
}


  function findSafestSingle() {
  if (games.length === 0) {
    return;
  }

  const rankedPicks =
    rankEasyRunLinePicks(games);

  const topPick =
    rankedPicks.find(
      (pick) =>
        pick.verdict !== "PASS"
    );

  if (!topPick) {
    setQuestion(
      "No qualified EasyRunLine +4.5 single is currently available."
    );

    setAnswer(
      "No MLB matchup currently satisfies the EasyRunLine +4.5 scoring and blowout-risk requirements for a qualified single."
    );

    return;
  }

  const marketVerificationClosing =
    "Verify that your sportsbook offers the recommended +4.5 alternate run line at an acceptable price. If the line is unavailable, the wagering action is PASS. Market availability does not change the supplied Engine Verdict.";

  const singleQuestion = `
Create an EasyRunLine AI report for the safest qualified single +4.5 MLB selection.

IMPORTANT:
This selection was produced by the EasyRunLine fixed scoring engine.

Do not perform a separate evaluation.
Do not change the selected team.
Do not recommend the favorite.
Do not replace the EasyRunLine +4.5 target with the visible standard +1.5 line.

Use the supplied ERL Score exactly as written.
Use the supplied Engine Confidence exactly as written.
Use the supplied Blowout Risk exactly as written.
Use the supplied Engine Verdict exactly as written.
Use the supplied Verdict Reason exactly as written.

The fixed engine verdict is authoritative.

Do not upgrade or downgrade the supplied verdict.
Do not change STRONG PLAY into PLAY, LEAN or PASS.
Do not change PLAY into LEAN or PASS.
Do not create a different verdict because the exact +4.5 market is not visible.

Market availability controls whether the wager can be placed.
It does not change the Engine Verdict.

Do not invent:
- a numerical cover probability
- an unsupported percentage
- alternate-line availability
- an alternate-line price
- expected value
- positive EV
- profitable value

Use the heading "🛡 Cover Outlook".

Use confident but evidence-based language.

Never use:
- guaranteed
- certain
- lock
- cannot lose
- minimal chance
- expected to cover comfortably
- comfortably cover
- reliable buffer

Starting-pitcher, recent-form and bullpen information are live intelligence when they appear in the supplied engine reasons.

Do not list those categories as missing when they appear in the reasons.

If a supplied reason says data is unavailable, do not invent or infer that information.

The exact +4.5 alternate line and price have not been confirmed.

Tell the user to verify the exact +4.5 line and price in their sportsbook.

If the line is unavailable, the wagering action is PASS.
This does not change the supplied Engine Verdict.

Weather and confirmed lineup data were not supplied.

Use this exact report structure:

══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

🎯 Safest Qualified +4.5 Single

${topPick.team} +4.5 vs ${topPick.opponent}

${formatMLBGameStart(
  topPick.team,
  topPick.opponent
)}

${topPick.team} —
ERL Score: ${topPick.score}/100
Engine Confidence: ${topPick.confidence}
Blowout Risk: ${topPick.blowoutRisk}
Engine Verdict: ${topPick.verdict}
Verdict Reason: ${topPick.verdictReason}

━━━━━━━━━━━━━━━━━━━━━━

📊 Confidence

Reproduce the supplied Engine Confidence exactly.

Explain briefly what it means for this individual +4.5 selection.

Do not create a different confidence label.

━━━━━━━━━━━━━━━━━━━━━━

🛡 Cover Outlook

Give a qualitative +4.5 cover outlook based only on the supplied engine evidence.

Do not provide a numerical probability.
Do not guarantee a cover.
Do not invent supporting information.

━━━━━━━━━━━━━━━━━━━━━━

💥 Blowout Risk

Reproduce the supplied Blowout Risk exactly.

Explain how the risk relates to the selected team losing by five or more runs.

Do not reinterpret or replace the supplied risk label.

━━━━━━━━━━━━━━━━━━━━━━

💰 Market Verification

The visible sportsbook feed may show only the standard +1.5 run line.

The exact +4.5 line and price were not supplied.

Do not claim betting value without the exact +4.5 price.

Explain that market verification determines whether the wager can be placed but does not change the Engine Verdict.

━━━━━━━━━━━━━━━━━━━━━━

📖 Visible Market Details

Moneyline:
${topPick.team}: ${topPick.moneyline}

Visible Standard Run Line:
${topPick.standardRunLine}

Bookmaker:
${topPick.bookmaker}

Clearly state that this visible full-game standard market does not confirm the availability or price of the +4.5 alternate line.

━━━━━━━━━━━━━━━━━━━━━━

🧠 Why This Single

Use clear bullet points based only on these supplied engine reasons:

${topPick.reasons
  .map(
    (reason) =>
      `• ${reason}`
  )
  .join("\n")}

Do not add unsupported evidence.

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Only list genuinely missing information.

Do not list starting pitchers, recent form or bullpen as missing when those factors appear in the supplied engine reasons.

Weather: Not supplied.
Confirmed Lineups: Not supplied.
Exact +4.5 alternate line and price: Not supplied.

━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Single Verdict

Reproduce this supplied Engine Verdict exactly:

${topPick.verdict}

Authoritative Verdict Reason:
${topPick.verdictReason}

Explain why the supplied ERL Score, Engine Confidence, Blowout Risk and engine reasons support this verdict.

Do not invent a different verdict.
Do not downgrade the verdict because the exact +4.5 line is not visible.

End the verdict with:

${marketVerificationClosing}

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

One Unit Only.
Never chase losses.
Never call anything a lock.
Always explain uncertainty.
`;

  setQuestion(singleQuestion);
  analyzeQuestion(
    singleQuestion
  );
}


function findBestTwoLegParlay() {
  if (games.length === 0) return;

  const rankedPicks = rankEasyRunLinePicks(games);

const uniqueMatchups = new Set<string>();

const topTwo = rankedPicks
  .filter((pick) => pick.verdict !== "PASS")
  .filter((pick) => {
  const matchupKey = [pick.team, pick.opponent]
    .sort()
    .join(" vs ");

  if (uniqueMatchups.has(matchupKey)) {
    return false;
  }

  uniqueMatchups.add(matchupKey);
  return true;
  })
  .slice(0, 2);

  if (topTwo.length < 2) return;
  const hasCautiousLeg = topTwo.some(
  (pick) => pick.verdict === "CAUTIOUS PLAY"
);

const hasLeanLeg = topTwo.some(
  (pick) => pick.verdict === "LEAN"
);

const allStrongPlays = topTwo.every(
  (pick) => pick.verdict === "STRONG PLAY"
);

let parlayVerdict: ScoredPick["verdict"];
let parlayVerdictReason: string;

if (hasCautiousLeg) {
  parlayVerdict = "CAUTIOUS PLAY";
  parlayVerdictReason =
    "At least one selected leg carries elevated matchup risk, so the full two-leg combination requires caution.";
} else if (hasLeanLeg) {
  parlayVerdict = "LEAN";
  parlayVerdictReason =
    "At least one selected leg has supporting +4.5 evidence but does not reach the strength required for a full parlay Play.";
} else if (allStrongPlays) {
  parlayVerdict = "STRONG PLAY";
  parlayVerdictReason =
    "Both selected legs carry Strong Play classifications with acceptable individual blowout risk.";
} else {
  parlayVerdict = "PLAY";
  parlayVerdictReason =
    "Both selected legs satisfy the EasyRunLine playing threshold, but the combination does not contain two Strong Play classifications.";
}

const parlayMarketVerificationClosing =
  "Verify that your sportsbook offers the +4.5 line at an acceptable price for both selections. If either line is unavailable, do not force the parlay; use an available qualified leg as a single or PASS.";

  const rankedText = rankedPicks
    .map(
      (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}
ERL Score: ${pick.score}/100
Engine Confidence: ${pick.confidence}
Blowout Risk: ${pick.blowoutRisk}
Engine Verdict: ${pick.verdict}
Verdict Reason: ${pick.verdictReason}
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
${pick.team} — ERL Score: ${pick.score}/100 — Engine Confidence: ${pick.confidence} — Blowout Risk: ${pick.blowoutRisk}
Engine Verdict: ${pick.verdict}
Verdict Reason: ${pick.verdictReason}`
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
Use every supplied Engine Verdict and Verdict Reason exactly as written.
Use the supplied Parlay Verdict and Parlay Verdict Reason exactly as written.

The fixed Engine Verdicts and Parlay Verdict are authoritative.
Do not upgrade, downgrade, average, reinterpret or replace any supplied engine rating or verdict.

Do not invent a combined ERL Score.
Do not invent a combined confidence label.
Do not invent a numerical cover probability or unsupported percentage.
Use the heading "🛡 Cover Outlook".

The exact +4.5 alternate lines and prices have not been confirmed.
The visible sportsbook feed may show only the standard run line.
Tell the user to verify the exact +4.5 alternate line and price for BOTH selections in their betting app.

Missing +4.5 pricing must not change either supplied Engine Verdict or the supplied Parlay Verdict.
If either +4.5 market is unavailable, do not force the parlay and do not invent a replacement team.
An available qualified leg may be considered separately as a single.

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

💰 Market Verification

Explain what the visible markets confirm and what remains unverified.
Do not claim betting value without the exact +4.5 prices.
Do not let missing +4.5 pricing change either individual Engine Verdict or the supplied Parlay Verdict.
Remind the user to verify both +4.5 lines and prices.
If either line is unavailable, do not force the parlay.

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

🏆 EasyRunLine Parlay Verdict

Reproduce this supplied Parlay Verdict exactly:

${parlayVerdict}

Authoritative Parlay Verdict Reason:
${parlayVerdictReason}

Do not create, change, upgrade, or downgrade the supplied Parlay Verdict.
Explain how the two individual Engine Verdicts, ERL Scores, confidence ratings, Blowout Risks and engine reasons support it.
Do not invent a combined score, probability or confidence rating.

${parlayMarketVerificationClosing}
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
  if (games.length === 0) {
    return;
  }

  const rankedPicks =
    rankEasyRunLinePicks(games);

  const uniqueAvoidMatchups =
    new Set<string>();

  const avoidPicks = rankedPicks
    .filter(
      (pick) =>
        pick.verdict === "PASS"
    )
    .filter((pick) => {
      const matchupKey = [
        pick.team,
        pick.opponent,
      ]
        .sort()
        .join(" vs ");

      if (
        uniqueAvoidMatchups.has(
          matchupKey
        )
      ) {
        return false;
      }

      uniqueAvoidMatchups.add(
        matchupKey
      );

      return true;
    })
    .slice(0, 5);

  if (avoidPicks.length === 0) {
    setQuestion(
      "No clear EasyRunLine +4.5 games to avoid are currently available."
    );

    setAnswer(
      "The EasyRunLine engine has not assigned a full-game +4.5 PASS verdict to any matchup on the current MLB slate."
    );

    return;
  }

  const avoidText = avoidPicks
    .map(
      (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}

${formatMLBGameStart(
  pick.team,
  pick.opponent
)}

${pick.team} —
ERL Score: ${pick.score}/100
Engine Confidence: ${pick.confidence}
Blowout Risk: ${pick.blowoutRisk}
Engine Verdict: ${pick.verdict}
Verdict Reason: ${pick.verdictReason}

Moneyline: ${pick.moneyline}
Visible Standard Run Line: ${pick.standardRunLine}
Bookmaker: ${pick.bookmaker}

Engine Reasons:
${pick.reasons
  .map(
    (reason) => `• ${reason}`
  )
  .join("\n")}
`
    )
    .join(
      "\n━━━━━━━━━━━━━━━━━━━━━━\n"
    );

  const avoidQuestion = `
Create an EasyRunLine AI report for the full-game MLB +4.5 selections that the fixed scoring engine has classified as PASS.

IMPORTANT:

Every matchup supplied below has received an authoritative Engine Verdict of PASS.

Do not perform a separate evaluation.
Do not change, upgrade or override any PASS verdict.
Do not recommend any supplied selection.
Do not recommend the opponent or favorite instead.
Do not suggest a different betting market.
Do not turn positive historical evidence into a recommendation.

Use every supplied:
- ERL Score
- Engine Confidence
- Blowout Risk
- Engine Verdict
- Verdict Reason
- engine reason

exactly as written.

When discussing positive evidence, describe it only as positive historical evidence that was overridden by the identified matchup risks.

Never describe a passed selection as:
- playable
- recommended
- suitable for wagering
- a positive play
- having a favorable cover outlook
- worth considering

Do not invent:
- cover probabilities
- unsupported percentages
- expected value
- positive EV
- sportsbook opinion
- statistics not included in the supplied engine reasons

Market availability does not control these PASS verdicts.
These matchups remain EasyRunLine full-game +4.5 passes even if the sportsbook offers the exact alternate line.

Starting-pitcher, recent-form, H2H and bullpen information are live intelligence whenever they appear in the supplied engine reasons.
Do not list those factors as missing when they have been supplied.

The Games to Avoid report applies only to the full-game +4.5 market.
Do not make claims about an F5 market from these full-game verdicts.

Use this exact report structure:

══════════════════════════════
⚠ EASYRUNLINE AI REPORT
══════════════════════════════

🚫 Full-Game +4.5 Selections To Avoid

${avoidText}

━━━━━━━━━━━━━━━━━━━━━━

📊 Why These Selections Failed

Explain each PASS separately.

For every selection, reproduce:
- its ERL Score
- its Engine Confidence
- its Blowout Risk
- its authoritative Verdict Reason

Clearly explain which risks overrode any positive historical evidence.

Do not create a combined score or combined confidence rating.

━━━━━━━━━━━━━━━━━━━━━━

💥 Blowout Risk Summary

Reproduce each supplied Blowout Risk exactly as written.

Explain how the identified pitching, market-gap, recent-form, H2H or bullpen concerns affect the possibility of losing beyond the +4.5 cushion.

Only discuss factors that appear in the supplied engine reasons.

━━━━━━━━━━━━━━━━━━━━━━

📉 Main Risk Factors

Explain each avoided matchup separately using only its supplied engine reasons.

Positive recent or H2H records may be acknowledged, but clearly state why those positive indicators were insufficient to overcome the identified risks.

Do not recommend any wager.

━━━━━━━━━━━━━━━━━━━━━━

📖 Visible Market Context

Explain that the visible moneyline and standard run line provide market context only.

The exact +4.5 market being available would not change any supplied Engine Verdict of PASS.

Do not claim value or expected value.

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Only list genuinely missing information.

Weather: Not supplied.
Confirmed Lineups: Not supplied.

Do not list recent form, H2H or bullpen as missing when those factors are supplied in the engine reasons.

If an engine reason explicitly says "Starting pitcher data unavailable", list:
"Starting Pitchers: Not supplied."
━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Avoid Verdict

State clearly that every listed full-game +4.5 selection remains an EasyRunLine PASS.

Reproduce each authoritative Verdict Reason.

Do not recommend the opponent.
Do not provide replacement selections.
Do not suggest forcing a wager because the +4.5 line is available.

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

Passing on weak or unsuitable matchups is part of disciplined bankroll management.

One Unit Only.
Never chase losses.
Never call anything a lock.
Never force action when the engine says PASS.
`;

  setQuestion(avoidQuestion);
  analyzeQuestion(avoidQuestion);
}

function findBestF5() {
  if (games.length === 0) {
    return;
  }

  const rankedF5Picks =
    rankF5Picks(games);

  const uniqueMatchups =
    new Set<string>();

  const topF5Picks =
    rankedF5Picks
      .filter(
        (pick) =>
          pick.verdict !== "PASS"
      )
      .filter((pick) => {
        const matchupKey = [
          pick.team,
          pick.opponent,
        ]
          .sort()
          .join(" vs ");

        if (
          uniqueMatchups.has(
            matchupKey
          )
        ) {
          return false;
        }

        uniqueMatchups.add(
          matchupKey
        );

        return true;
      })
      .slice(0, 2);

  if (
    topF5Picks.length === 0
  ) {
    setQuestion(
      "No qualified EasyRunLine F5 +2.5 selection is currently available."
    );

    setAnswer(
      "No MLB matchup currently satisfies the independent EasyRunLine F5 +2.5 scoring and early-risk requirements."
    );

    return;
  }

  const selectionHeading =
    topF5Picks.length === 2
      ? "🔥 Best Two F5 Angles"
      : "🔥 Best F5 Angle";

  const selectedText =
    topF5Picks
      .map(
        (pick, index) => `
${index + 1}. ${pick.team} F5 +2.5 or safer vs ${pick.opponent}

${formatMLBGameStart(
  pick.team,
  pick.opponent
)}

${pick.team} —
F5 ERL Score: ${pick.score}/100
Engine Confidence: ${pick.confidence}
Early Blowout Risk: ${pick.earlyBlowoutRisk}
Engine Verdict: ${pick.verdict}
Verdict Reason: ${pick.verdictReason}
`
      )
      .join(
        "\n━━━━━━━━━━━━━━━━━━━━━━\n"
      );

  const selectedMarketDetails =
    topF5Picks
      .map(
        (pick, index) => `
${index + 1}. ${pick.team} F5 +2.5 or safer vs ${pick.opponent}

Moneyline:
${pick.moneyline}

Visible Full-Game Standard Run Line:
${pick.standardRunLine}

Bookmaker:
${pick.bookmaker}
`
      )
      .join("\n");

  const selectedReasons =
    topF5Picks
      .map(
        (pick, index) => `
${index + 1}. ${pick.team}

${pick.reasons
  .map(
    (reason) =>
      `• ${reason}`
  )
  .join("\n")}
`
      )
      .join("\n");

  const suppliedVerdicts =
    topF5Picks
      .map(
        (pick, index) => `
${index + 1}. ${pick.team}

Engine Verdict:
${pick.verdict}

Authoritative Verdict Reason:
${pick.verdictReason}
`
      )
      .join("\n");

  const marketVerificationClosing =
    topF5Picks.length === 2
      ? "Verify that your sportsbook offers the recommended F5 +2.5 or safer alternate line at an acceptable price for both selections. If either line is unavailable, do not force that selection; the wagering action for the unavailable line is PASS. Market availability does not change either supplied Engine Verdict."
      : "Verify that your sportsbook offers the recommended F5 +2.5 or safer alternate line at an acceptable price. If the line is unavailable, the wagering action is PASS. Market availability does not change the supplied Engine Verdict.";

  const f5Question = `
Create an EasyRunLine AI report for the strongest qualified First 5 Innings MLB selections.

IMPORTANT:
These selections were produced by the independent EasyRunLine F5 fixed scoring engine.

Do not perform a separate selection process.
Do not change any selected team.
Do not recommend an opponent.
Do not add another selection.
Do not convert these into full-game +4.5 recommendations.
Do not replace an F5 +2.5 target with the visible full-game standard run line.
The supplied Last-10 F5 run differential is the cumulative run differential across the games counted.
Never call it an average run differential.

The supplied F5 averages are the per-game averages for runs scored and runs allowed.
Do not confuse cumulative run differential with per-game scoring averages.

Do not describe a selection as an "active wagering decision", "wager still justifiable", or ready to wager before its exact F5 alternate line and price are verified.
The Engine Verdict evaluates matchup suitability; market verification determines whether the wager can actually be placed.

This report concerns the First 5 Innings only.

Use every supplied F5 ERL Score exactly as written.
Use every supplied Engine Confidence exactly as written.
Use every supplied Early Blowout Risk exactly as written.
Use every supplied Engine Verdict exactly as written.
Use every supplied Verdict Reason exactly as written.

The fixed F5 engine verdicts are authoritative.

Do not upgrade or downgrade any supplied verdict.
Do not average the selections.
Do not invent a combined score.
Do not invent a combined confidence rating.
Do not invent a combined Early Blowout Risk.
Do not produce a combined or parlay verdict.

Market availability controls whether the user can place a wager. It does not change the supplied Engine Verdict.

Do not invent numerical cover probabilities or unsupported percentages.

Never use:
- guaranteed
- certain
- lock
- minimal chance
- expected to cover comfortably
- comfortably cover
- reliable buffer
- cannot lose

Starting-pitcher information is an important F5 factor.

If a selection's reasons say:
"Starting pitcher data unavailable"

then state:
"Starting Pitchers: Not supplied. F5 confidence is limited."

When pitcher data is unavailable:
- do not describe the pitching matchup as favourable
- do not describe it as balanced
- do not describe it as competitive
- do not claim that other evidence compensates for the missing pitching data
- do not invent pitcher names, ERAs, handedness, form or matchup history
- do not mention pitching as support in that selection's Cover Outlook

Use recent F5 evidence and F5 H2H evidence exactly as supplied.

Do not replace F5 statistics with full-game +4.5 statistics.

Bullpen information is not part of this independent F5 score.
Do not use bullpen strength to support or reject these selections.

The exact F5 +2.5 or safer alternate lines and prices have not been confirmed.

If an exact F5 target is unavailable, state that the wagering action for that selection is PASS.

Do not change its supplied Engine Verdict because of market availability.

Weather and confirmed lineup information were not supplied.

Use this exact report structure:

══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

${selectionHeading}

${selectedText}

━━━━━━━━━━━━━━━━━━━━━━

📊 Individual Confidence

Discuss each selected team's supplied Engine Confidence separately.

Do not create a combined confidence label.

Explain briefly what each supplied confidence level means for that individual F5 target.

━━━━━━━━━━━━━━━━━━━━━━

🛡 Individual F5 Cover Outlook

Give a separate qualitative F5 +2.5 cover outlook for each selection.

Use only the supplied F5 evidence.

Do not provide percentages.
Do not guarantee a cover.
Do not describe a PASS wagering action as changing the Engine Verdict.

If starting-pitcher data is unavailable for a selection, do not use pitching as support for its outlook.

━━━━━━━━━━━━━━━━━━━━━━

⚾ Starting Pitching Assessment

Discuss each selection separately.

Use only the supplied pitcher reason.

When the reason says starting-pitcher data is unavailable, state:

"Starting Pitchers: Not supplied. F5 confidence is limited."

Do not infer a balanced, favourable or competitive pitching matchup from missing information.

━━━━━━━━━━━━━━━━━━━━━━

🚀 Early-Offense Outlook

Discuss each selection separately using only:

- supplied F5 runs scored
- supplied F5 runs allowed
- supplied F5 run differential
- supplied recent F5 +2.5 record
- supplied H2H F5 evidence

Do not invent additional batting statistics, inning splits or scoring trends.

━━━━━━━━━━━━━━━━━━━━━━

💥 Individual Early Blowout Risk

Reproduce each supplied Early Blowout Risk exactly.

Explain separately how each risk applies to falling outside the +2.5 cushion before the end of the fifth inning.

Do not average the risk labels.

━━━━━━━━━━━━━━━━━━━━━━

💰 Market Verification

The exact F5 alternate lines and prices were not supplied.

Do not claim:
- positive expected value
- +EV
- profitable value
- strong betting value
- sportsbook confidence

Explain that every selected F5 line and price must be verified independently.

Market verification does not change the supplied Engine Verdicts.

━━━━━━━━━━━━━━━━━━━━━━

📖 Visible Market Details

${selectedMarketDetails}

Clearly state that these visible full-game markets do not confirm the availability or price of the F5 alternate targets.

━━━━━━━━━━━━━━━━━━━━━━

🧠 Why These F5 Selections

Explain each selection separately using only these engine reasons:

${selectedReasons}

Do not introduce unsupported evidence.
Do not use bullpen strength.
Do not claim favourable pitching when pitcher data is unavailable.

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Only list genuinely missing information.

Weather: Not supplied.
Confirmed Lineups: Not supplied.
Exact F5 alternate lines and prices: Not supplied.

List Starting Pitchers as not supplied only for selections whose engine reasons say the pitcher data is unavailable.

━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Individual F5 Verdicts

Reproduce these supplied verdicts exactly:

${suppliedVerdicts}

Explain separately why each F5 score, confidence, Early Blowout Risk and supplied engine evidence support its verdict.

Do not produce a combined verdict.
Do not describe these selections as a parlay.
Do not downgrade a verdict because its exact F5 market is not visible.

End this section with:

${marketVerificationClosing}

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

One Unit Only.
Never chase losses.
Never call anything a lock.
F5 bets cover only the First 5 Innings.
Verify every exact F5 alternate line and price independently.
`;

  setQuestion(f5Question);
  analyzeQuestion(f5Question);
}


function findBestThreeLegParlay() {
    if (games.length === 0) return;

  const rankedPicks = rankEasyRunLinePicks(games);
  const uniqueMatchups = new Set<string>();

const topThree = rankedPicks
  .filter((pick) => pick.verdict !== "PASS")
  .filter((pick) => {
    const matchupKey = [pick.team, pick.opponent]
      .sort()
      .join(" vs ");

    if (uniqueMatchups.has(matchupKey)) {
      return false;
    }

    uniqueMatchups.add(matchupKey);
    return true;
  })
  .slice(0, 3);

if (topThree.length < 3) return;
const hasCautiousLeg = topThree.some(
  (pick) => pick.verdict === "CAUTIOUS PLAY"
);

const hasLeanLeg = topThree.some(
  (pick) => pick.verdict === "LEAN"
);

const allStrongPlays = topThree.every(
  (pick) => pick.verdict === "STRONG PLAY"
);

let threeLegVerdict: ScoredPick["verdict"];
let threeLegVerdictReason: string;

if (hasCautiousLeg) {
  threeLegVerdict = "CAUTIOUS PLAY";
  threeLegVerdictReason =
    "At least one selected leg carries elevated matchup risk, so the full three-leg combination requires caution.";
} else if (hasLeanLeg) {
  threeLegVerdict = "LEAN";
  threeLegVerdictReason =
    "At least one selected leg has supporting +4.5 evidence but does not reach the strength required for a full three-leg Play.";
} else if (allStrongPlays) {
  threeLegVerdict = "STRONG PLAY";
  threeLegVerdictReason =
    "All three selected legs carry Strong Play classifications with acceptable individual blowout risk.";
} else {
  threeLegVerdict = "PLAY";
  threeLegVerdictReason =
    "All three selected legs satisfy the EasyRunLine playing threshold, but the combination does not contain three Strong Play classifications.";
}

const threeLegMarketVerificationClosing =
  "Verify that your sportsbook offers the +4.5 line at an acceptable price for all three selections. If any line is unavailable, do not force the three-leg parlay; use fewer available qualified legs or PASS.";

  const rankedText = rankedPicks
    .map(
      (pick, index) => `
${index + 1}. ${pick.team} +4.5 vs ${pick.opponent}
Engine Rating: ${pick.team} — ERL Score: ${pick.score}/100
Engine Confidence: ${pick.confidence}
Blowout Risk: ${pick.blowoutRisk}
Engine Verdict: ${pick.verdict}
Verdict Reason: ${pick.verdictReason}
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
Engine Verdict: ${pick.verdict}
Verdict Reason: ${pick.verdictReason}
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
Use every supplied Engine Verdict and Verdict Reason exactly as written.
Use the supplied Three-Leg Verdict and Three-Leg Verdict Reason exactly as written.

The fixed Engine Verdicts and Three-Leg Verdict are authoritative.
Do not upgrade, downgrade, average, reinterpret or replace any supplied engine rating or verdict.

Do not invent a combined ERL Score.
Do not invent a combined confidence label.
Do not invent numerical cover probabilities or unsupported percentages.

Use the heading "🛡 Cover Outlook".

The exact +4.5 alternate run lines and prices have not been confirmed.
The visible sportsbook feed may only show the standard run line.

Tell the user to verify the exact +4.5 alternate run line and price for ALL THREE selections before placing the parlay.

Missing +4.5 pricing must not change any supplied Engine Verdict or the supplied Three-Leg Verdict.
If any +4.5 market is unavailable, do not force the parlay and do not invent a replacement team.
Use fewer available qualified legs or PASS.

Starting pitcher, recent form and bullpen information are live intelligence whenever they appear in the supplied engine reasons.

Do not list those categories as missing if they appear in the supplied reasons.

Weather and confirmed lineup data were not supplied.

Use this exact report format:

══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

🎯 Recommended 3-Leg +4.5 Parlay

${selectedText}
Three-Leg Verdict: ${threeLegVerdict}
Three-Leg Verdict Reason: ${threeLegVerdictReason}

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

💰 Market Verification

Explain what the visible markets confirm and what remains unverified.

Do not claim betting value without the exact +4.5 prices.

Do not let missing +4.5 pricing change any individual Engine Verdict or the supplied Three-Leg Verdict.

Remind the user to verify all three +4.5 lines and prices.

If any line is unavailable, do not force the three-leg parlay.

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

🏆 EasyRunLine Three-Leg Verdict

Reproduce this supplied Three-Leg Verdict exactly:

${threeLegVerdict}

Authoritative Three-Leg Verdict Reason:
${threeLegVerdictReason}

Do not create, change, upgrade or downgrade the supplied Three-Leg Verdict.

Explain how the three individual Engine Verdicts, ERL Scores, confidence ratings, Blowout Risks and engine reasons support it.

Do not invent a combined score, probability or confidence rating.

${threeLegMarketVerificationClosing}

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
      

      

<header className="border-b border-zinc-900 bg-black/95">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
    <Link
      href="/"
      className="flex items-center gap-3"
      aria-label="Return to EasyRunLine homepage"
    >
      <Image
  src="/brand/erl-logo.png"
  alt="EasyRunLine Logo"
  width={44}
  height={44}
  priority
  className="rounded-lg"
/>

      <div>
        <p className="text-sm font-black tracking-[0.22em] text-yellow-400">
          EASYRUNLINE
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          MLB Intelligence
        </p>
      </div>
    </Link>

    <div className="flex items-center gap-3">
  <Link
    href="/"
    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-yellow-400 hover:text-yellow-400"
  >
    ← Home
  </Link>

  <SportSelector />
</div>
  </div>
</header>

<section className="mx-auto max-w-7xl px-6 py-10">
  <div className="max-w-3xl">
    <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
      MLB Run-Line Intelligence
    </p>

    <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
      Live MLB Games and Protected Run-Line Analysis
    </h1>

    <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
      Review verified MLB markets, starting pitchers, recent form,
      bullpen strength and EasyRunLine alternate-run-line analysis.
    </p>
  </div>

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
  onClick={() => {
    const qualified =
      rankedAlternateTotals
        .filter(
          (total) =>
            total.verdict ===
              "STRONG PLAY" ||
            total.verdict ===
              "PLAY"
        )
        .filter(
          (total, index, all) =>
            index ===
            all.findIndex(
              (other) =>
                other.gameId ===
                total.gameId
            )
        )
        .slice(0, 2);

    if (qualified.length === 0) {
  const bestLean =
    rankedAlternateTotals.find(
      (total) =>
        total.verdict === "LEAN"
    );

  if (!bestLean) {
    setAnswer(
      `══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

⚠ No Official Alternate Total Play

No MLB alternate total currently qualifies as a PLAY, STRONG PLAY, or LEAN.

EasyRunLine Action:
PASS — no qualified alternate-total wager is recommended on this slate.`
    );

    return;
  }

  setAnswer(
    `══════════════════════════════
⚾ EASYRUNLINE AI REPORT
══════════════════════════════

⚠ No Official Alternate Total Play

No MLB alternate total currently qualifies as a PLAY or STRONG PLAY.

━━━━━━━━━━━━━━━━━━━━━━

Best Available Lean:

${bestLean.awayTeam} vs ${bestLean.homeTeam}

Selection:
${bestLean.direction} ${bestLean.line}

EasyRunLine Total Score:
${bestLean.score}/100

Engine Verdict:
${bestLean.verdict}

Best Available Price:
${bestLean.bestPrice}

Bookmaker:
${bestLean.bookmaker}

━━━━━━━━━━━━━━━━━━━━━━

EasyRunLine Action:

LEAN ONLY — not an official play.

The selection is shown for reference because it is the strongest remaining alternate-total candidate, but it does not meet the EasyRunLine threshold for an official PLAY.

If the line or price changes materially, PASS rather than forcing the wager.`
  );

  window.setTimeout(() => {
    answerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 100);

  return;
}

    setAnswer(
  buildMLBAlternateTotalsReport(
    qualified
  )
);

    window.setTimeout(() => {
      answerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }}
  disabled={
    loading ||
    gamesLoading ||
    rankedAlternateTotals.length === 0
  }
  className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
>
  Safest Alternate Totals
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