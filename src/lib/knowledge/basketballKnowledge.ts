import type {
  KnowledgeEntry,
} from "./bettingKnowledge";

export const BASKETBALL_KNOWLEDGE: KnowledgeEntry[] =
  [
    {
      id: "pace",
      title: "Pace",
      category: "betting_strategy",
      aliases: [
        "basketball pace",
        "game pace",
        "possessions per game",
      ],
      summary:
        "Pace estimates how many possessions a team uses in a game.",
      explanation:
        "Faster-paced teams create more possessions, which can increase scoring opportunities and total volatility. Slower-paced teams reduce the number of possessions and may support lower-scoring game environments.",
      warnings: [
        "Pace should be combined with offensive and defensive efficiency.",
        "A fast game does not automatically guarantee an over.",
      ],
    },

    {
      id: "offensive-rating",
      title: "Offensive Rating",
      category: "betting_strategy",
      aliases: [
        "offensive efficiency",
        "ortg",
        "points per 100 possessions",
      ],
      summary:
        "Offensive rating estimates how many points a team scores per 100 possessions.",
      explanation:
        "It adjusts scoring for pace, making it more useful than points per game alone when comparing teams that play at different speeds.",
      warnings: [
        "Recent injuries and lineup changes can affect offensive efficiency.",
        "Use home, away and recent splits where available.",
      ],
    },

    {
      id: "defensive-rating",
      title: "Defensive Rating",
      category: "betting_strategy",
      aliases: [
        "defensive efficiency",
        "drtg",
        "points allowed per 100 possessions",
      ],
      summary:
        "Defensive rating estimates how many points a team allows per 100 possessions.",
      explanation:
        "A lower defensive rating generally indicates stronger defence. It allows analysts to compare defensive performance while accounting for pace.",
      warnings: [
        "Defensive rating can be affected by opponent quality.",
        "Recent lineups may differ from full-season performance.",
      ],
    },

    {
      id: "net-rating",
      title: "Net Rating",
      category: "betting_strategy",
      aliases: [
        "net efficiency",
        "netrtg",
      ],
      summary:
        "Net rating is offensive rating minus defensive rating.",
      explanation:
        "A positive net rating means a team scores more points than it allows per 100 possessions. It is a useful measure of overall team quality.",
      example:
        "An offensive rating of 116 and defensive rating of 110 produces a +6 net rating.",
      warnings: [
        "Small samples can create misleading net ratings.",
        "Check recent form and opponent strength.",
      ],
    },

    {
      id: "effective-field-goal-percentage",
      title: "Effective Field-Goal Percentage",
      category: "betting_strategy",
      aliases: [
        "efg",
        "efg%",
        "effective field goal",
      ],
      summary:
        "Effective field-goal percentage adjusts shooting percentage because three-pointers are worth more than two-pointers.",
      explanation:
        "eFG% gives additional weight to made three-pointers and provides a better picture of shooting efficiency than regular field-goal percentage.",
      warnings: [
        "Shooting percentages can fluctuate sharply over short samples.",
        "Use shot quality and opponent defence as supporting context.",
      ],
    },

    {
      id: "true-shooting-percentage",
      title: "True Shooting Percentage",
      category: "betting_strategy",
      aliases: [
        "true shooting",
        "ts%",
      ],
      summary:
        "True shooting percentage measures scoring efficiency using field goals, three-pointers and free throws.",
      explanation:
        "It combines the value of all major scoring methods into one efficiency measure and is useful for evaluating players and teams.",
      warnings: [
        "True shooting does not measure playmaking or defence.",
        "Compare similar roles and usage levels.",
      ],
    },

    {
      id: "turnover-percentage",
      title: "Turnover Percentage",
      category: "betting_strategy",
      aliases: [
        "turnover rate",
        "tov%",
      ],
      summary:
        "Turnover percentage estimates how often a possession ends in a turnover.",
      explanation:
        "Teams with high turnover rates lose scoring opportunities and may give opponents easy transition chances. This can affect spreads, team totals and game totals.",
      warnings: [
        "Fast pace can increase raw turnover totals.",
        "Matchup pressure matters.",
      ],
    },

    {
      id: "rebounding-percentage",
      title: "Rebounding Percentage",
      category: "betting_strategy",
      aliases: [
        "rebound rate",
        "offensive rebound percentage",
        "defensive rebound percentage",
      ],
      summary:
        "Rebounding percentage estimates how many available rebounds a team secures.",
      explanation:
        "Strong offensive rebounding creates second-chance possessions, while strong defensive rebounding ends opponent possessions.",
      warnings: [
        "Player availability can significantly change rebounding strength.",
        "Raw rebound totals are affected by pace and missed shots.",
      ],
    },

    {
      id: "free-throw-rate",
      title: "Free-Throw Rate",
      category: "betting_strategy",
      aliases: [
        "free throw rate",
        "ftr",
      ],
      summary:
        "Free-throw rate measures how often a team or player reaches the free-throw line relative to shot attempts.",
      explanation:
        "Frequent free throws can improve scoring efficiency, slow the game clock and influence totals late in games.",
      warnings: [
        "Referee tendencies and matchup style can matter.",
        "Late intentional fouling can inflate totals.",
      ],
    },

    {
      id: "first-half-basketball",
      title: "Basketball First-Half Market",
      category: "betting_market",
      aliases: [
  "basketball first half",
  "basketball first half total",
  "nba first half",
  "nba first half total",
  "wnba first half",
  "wnba first half total",
  "h1 basketball",
  "h1 total",
],
      summary:
        "A basketball first-half market is settled using only the first two quarters.",
      explanation:
        "First-half analysis should emphasise starting lineups, early rotations, first-half scoring, first-half defence and opening pace.",
      warnings: [
        "Do not rely only on full-game averages.",
        "Confirm how a tied first-half spread is settled.",
      ],
    },

    {
      id: "first-quarter-basketball",
      title: "Basketball First-Quarter Market",
      category: "betting_market",
      aliases: [
        "basketball first quarter",
        "nba q1",
        "wnba q1",
        "q1 basketball",
      ],
      summary:
        "A basketball first-quarter market is settled using only the opening quarter.",
      explanation:
        "Q1 markets depend heavily on starting lineups, early pace, first-quarter offensive efficiency and first-quarter defensive performance.",
      warnings: [
        "Quarter markets are more volatile because the sample is short.",
        "Use quarter-specific data whenever possible.",
      ],
    },

    {
      id: "basketball-team-total",
      title: "Basketball Team Total",
      category: "betting_market",
      aliases: [
        "nba team total",
        "wnba team total",
        "basketball team points",
      ],
      summary:
        "A basketball team total is a wager on one team's points rather than the combined score.",
      explanation:
        "Team-total analysis compares the selected team's offence with the opponent's defence while accounting for pace, injuries and expected rotations.",
      warnings: [
        "Confirm whether the market is full game, first half or first quarter.",
        "Late lineup changes can materially affect the projection.",
      ],
    },

    {
      id: "alternate-basketball-spread",
      title: "Basketball Alternate Spread",
      category: "betting_market",
      aliases: [
        "nba alternate spread",
        "wnba alternate spread",
        "basketball alt spread",
      ],
      summary:
        "A basketball alternate spread changes the standard point spread to provide more or less protection.",
      explanation:
        "A larger positive spread gives an underdog more cushion but usually at shorter odds. A more aggressive negative spread offers a higher potential return but requires a larger winning margin.",
      warnings: [
        "More cushion normally means lower odds.",
        "Always verify the exact alternate line and price.",
      ],
    },

    {
      id: "basketball-total",
      title: "Basketball Game Total",
      category: "betting_market",
      aliases: [
  "nba total",
  "wnba total",
  "nba full game total",
  "wnba full game total",
  "basketball full game total",
  "basketball over under",
],
      summary:
        "A basketball total is based on the combined points scored by both teams.",
      explanation:
        "Totals are influenced by pace, offensive efficiency, defensive efficiency, shooting profile, turnovers, rebounding and free-throw frequency.",
      warnings: [
        "Overtime normally counts in full-game totals unless stated otherwise.",
        "Late fouling can significantly affect totals.",
      ],
    },

    {
      id: "basketball-alternate-total",
      title: "Basketball Alternate Total",
      category: "betting_market",
      aliases: [
        "nba alternate total",
        "wnba alternate total",
        "basketball alt total",
      ],
      summary:
        "An alternate total changes the standard over-under line.",
      explanation:
        "A bettor may choose a lower over or higher under for more protection, usually at shorter odds.",
      warnings: [
        "The exact alternate total must be available at the sportsbook.",
        "More protection does not remove variance.",
      ],
    },

    {
      id: "home-away-splits-basketball",
      title: "Basketball Home and Away Splits",
      category: "betting_strategy",
      aliases: [
        "basketball home split",
        "basketball away split",
        "home road performance",
      ],
      summary:
        "Home and away splits compare performance by venue.",
      explanation:
        "Teams may perform differently at home and on the road because of travel, crowd support, familiar surroundings and scheduling conditions.",
      warnings: [
        "Do not overweight small samples.",
        "Opponent strength should be considered.",
      ],
    },

    {
      id: "rest-and-back-to-back",
      title: "Rest and Back-to-Back Games",
      category: "betting_strategy",
      aliases: [
        "back to back",
        "b2b",
        "rest disadvantage",
        "rest advantage",
      ],
      summary:
        "Rest conditions measure how much recovery time a team has before a game.",
      explanation:
        "Back-to-back games and travel can affect energy, rotations, shooting and defensive effort. The impact may be greater for older rosters or teams with limited depth.",
      warnings: [
        "Rest alone should not determine a bet.",
        "Check whether key players were rested in the previous game.",
      ],
    },

    {
      id: "garbage-time",
      title: "Garbage Time",
      category: "betting_strategy",
      aliases: [
        "garbage time points",
        "late bench scoring",
      ],
      summary:
        "Garbage time is the late part of a game when the result is largely decided and reserve players may enter.",
      explanation:
        "Late scoring by bench units can change alternate spreads, totals and team totals even when the competitive portion of the game is over.",
      warnings: [
        "Large spreads carry greater garbage-time risk.",
        "Bench depth can affect late scoring.",
      ],
    },

    {
      id: "blowout-risk-basketball",
      title: "Basketball Blowout Risk",
      category: "betting_strategy",
      aliases: [
        "nba blowout risk",
        "wnba blowout risk",
        "large margin risk",
      ],
      summary:
        "Blowout risk estimates the chance that one team loses by a large margin.",
      explanation:
        "It can be influenced by net-rating gaps, injuries, rest, depth, recent point differential and matchup weaknesses.",
      warnings: [
        "Low blowout risk does not guarantee a spread cover.",
        "Late bench play can widen or reduce the final margin.",
      ],
    },
  ];