import type { SoccerTeamForm } from "./soccerForm";

export type SoccerVenue = "home" | "away";

export type ERLSoccerRatingBreakdown = {
  marketStrength: number;
  currentForm: number;
  attackStrength: number;
  defensiveStability: number;
  venueStrength: number;
};

export type ERLSoccerTeamRating = {
  teamName: string;
  powerRating: number;
  dataCompleteness: number;
  breakdown: ERLSoccerRatingBreakdown;
  reasons: string[];
};

export type BuildSoccerRatingInput = {
  teamName: string;
  venue: SoccerVenue;

  /**
   * Normalized market probability from 0 to 1.
   * Example: 0.68 means 68%.
   */
  marketProbability: number;

  /**
   * May be null until the soccer-form API is connected.
   */
  form: SoccerTeamForm | null;
};

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(Math.max(value, minimum), maximum);
}

function rateMarketStrength(probability: number) {
  return clamp(probability * 100);
}

function rateCurrentForm(form: SoccerTeamForm | null) {
  if (!form || form.matchesPlayed === 0) {
    return 50;
  }

  const pointsScore =
    (form.recentPointsPerGame / 3) * 100;

  const goalDifferenceScore =
    50 + form.recentGoalDifferencePerGame * 15;

  return clamp(
    pointsScore * 0.7 +
      goalDifferenceScore * 0.3
  );
}

function rateAttackStrength(form: SoccerTeamForm | null) {
  if (!form || form.matchesPlayed === 0) {
    return 50;
  }

  /*
   * Two goals per match grades as approximately 80.
   * Three goals per match reaches the upper limit.
   */
  return clamp(
    20 + form.averageGoalsFor * 30
  );
}

function rateDefensiveStability(
  form: SoccerTeamForm | null
) {
  if (!form || form.matchesPlayed === 0) {
    return 50;
  }

  /*
   * Fewer goals conceded produces a higher score.
   * 0 conceded per match = 100.
   * 2 conceded per match = approximately 40.
   */
  return clamp(
    100 - form.averageGoalsAgainst * 30
  );
}

function rateVenueStrength(
  form: SoccerTeamForm | null,
  venue: SoccerVenue
) {
  if (!form) {
    return venue === "home" ? 55 : 50;
  }

  const matchesPlayed =
    venue === "home"
      ? form.homeMatchesPlayed
      : form.awayMatchesPlayed;

  if (matchesPlayed === 0) {
    return venue === "home" ? 55 : 50;
  }

  const wins =
    venue === "home"
      ? form.homeWins
      : form.awayWins;

  const draws =
    venue === "home"
      ? form.homeDraws
      : form.awayDraws;

  const venuePoints = wins * 3 + draws;
  const venuePointsPerGame =
    venuePoints / matchesPlayed;

  return clamp(
    (venuePointsPerGame / 3) * 100
  );
}

function calculateDataCompleteness(
  form: SoccerTeamForm | null
) {
  if (!form) {
    return 35;
  }

  if (form.matchesPlayed >= 8) {
    return 100;
  }

  return clamp(
    35 + (form.matchesPlayed / 8) * 65
  );
}

export function buildERLSoccerTeamRating(
  input: BuildSoccerRatingInput
): ERLSoccerTeamRating {
  const marketStrength = rateMarketStrength(
    input.marketProbability
  );

  const currentForm = rateCurrentForm(input.form);

  const attackStrength = rateAttackStrength(
    input.form
  );

  const defensiveStability =
    rateDefensiveStability(input.form);

  const venueStrength = rateVenueStrength(
    input.form,
    input.venue
  );

  /*
   * Version 1 weighting:
   *
   * Market strength:       40%
   * Recent form:           25%
   * Attack strength:       15%
   * Defensive stability:  15%
   * Venue strength:         5%
   */
  const powerRating = clamp(
    marketStrength * 0.4 +
      currentForm * 0.25 +
      attackStrength * 0.15 +
      defensiveStability * 0.15 +
      venueStrength * 0.05
  );

  const reasons: string[] = [];

  if (marketStrength >= 70) {
    reasons.push(
      "Strong market-implied team strength."
    );
  }

  if (currentForm >= 70) {
    reasons.push(
      "Strong recent results and momentum."
    );
  }

  if (attackStrength >= 70) {
    reasons.push(
      "High recent attacking output."
    );
  }

  if (defensiveStability >= 70) {
    reasons.push(
      "Strong recent defensive stability."
    );
  }

  if (venueStrength >= 70) {
    reasons.push(
      `Strong ${input.venue} performance profile.`
    );
  }

  if (!input.form) {
    reasons.push(
      "Historical form data is not connected yet, so this rating currently relies more heavily on market strength."
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      "Balanced team profile without a dominant statistical advantage."
    );
  }

  return {
    teamName: input.teamName,
    powerRating: Number(powerRating.toFixed(1)),
    dataCompleteness:
      calculateDataCompleteness(input.form),
    breakdown: {
      marketStrength: Number(
        marketStrength.toFixed(1)
      ),
      currentForm: Number(currentForm.toFixed(1)),
      attackStrength: Number(
        attackStrength.toFixed(1)
      ),
      defensiveStability: Number(
        defensiveStability.toFixed(1)
      ),
      venueStrength: Number(
        venueStrength.toFixed(1)
      ),
    },
    reasons,
  };
}