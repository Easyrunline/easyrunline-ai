/* ===========================================================
   EASYRUNLINE AI
   NHL GAME ANALYZER
   =========================================================== */
   import { compareTeams } from "./comparison";

import type {
  NHLGameAnalysis,
  NHLGameRecommendation,
} from "./types";

import {
  scoreGoalie,
  scoreRecentForm,
  scoreGoalDifferential,
  scoreOffense,
  scoreDefense,
  scoreHomeIce,
  scoreInjuries,
  scoreMarket,
} from "./scoring";

import {
  calculateNHLERLScore,
} from "./erlScore";

import type {
  NHLTeamAnalysis,
  NHLRecommendation,
} from "./types";

export function analyzeTeam(
  team: NHLTeamAnalysis,
  isHome: boolean
): NHLRecommendation {

  const goalie =
    scoreGoalie(
      team.goalie.savePct
    );

  const recentForm =
    scoreRecentForm(
      team.form.pointsPct
    );

  const goalDifferential =
    scoreGoalDifferential(
      team.form.goalDifferential
    );

  const offense =
    scoreOffense(
      team.stats.goalsPerGame
    );

  const defense =
    scoreDefense(
      team.stats.goalsAgainstPerGame
    );

  const homeIce =
    scoreHomeIce(
      isHome
    );

  const injuries =
    scoreInjuries(
      team.injuries.keyPlayersOut
    );

  const market =
    scoreMarket(
      team.market.impliedProbability
    );

  const erl =
    calculateNHLERLScore({

      goalie,

      recentForm,

      goalDifferential,

      offense,

      defense,

      homeIce,

      injuries,

      market,

    });

  return {

    team: team.team,

    erlScore: erl.totalScore,

    confidence: erl.confidence,

    recommendation: erl.recommendation,

    breakdown: {

      goalie,

      recentForm,

      goalDifferential,

      offense,

      defense,

      homeIce,

      injuries,

      market,

    },

  };

}
export function analyzeGame(
  game: NHLGameAnalysis
): NHLGameRecommendation {

  const home =
    analyzeTeam(
      game.home,
      true
    );

  const away =
    analyzeTeam(
      game.away,
      false
    );

  const comparison =
    compareTeams(
      home,
      away
    );

  const recommendedTeam =
    comparison.winner === home.team
      ? home
      : away;

  return {

    home,

    away,

    comparison,

    recommendedTeam,

  };

}