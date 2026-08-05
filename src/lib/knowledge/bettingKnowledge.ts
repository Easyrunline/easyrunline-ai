export type KnowledgeCategory =
  | "betting_market"
  | "probability"
  | "bankroll"
  | "betting_strategy"
  | "responsible_betting";

export type KnowledgeEntry = {
  id: string;
  title: string;
  category: KnowledgeCategory;
  aliases: string[];
  summary: string;
  explanation: string;
  example?: string;
  warnings?: string[];
};

export const BETTING_KNOWLEDGE: KnowledgeEntry[] =
  [
    {
      id: "moneyline",
      title: "Moneyline",
      category: "betting_market",
      aliases: [
        "money line",
        "straight up bet",
        "win bet",
      ],
      summary:
        "A moneyline bet is a wager on which team or player will win.",
      explanation:
        "The selection must win the event according to the sportsbook's settlement rules. The point margin usually does not matter. In sports that allow draws, always confirm whether the market is a two-way moneyline, draw-no-bet market or three-way moneyline.",
      example:
        "If Team A is priced at 1.80 and wins, a R100 stake returns R180 before considering any applicable deductions.",
      warnings: [
        "Confirm whether overtime or extra time counts.",
        "Soccer three-way moneyline includes the draw as a separate outcome.",
      ],
    },

    {
      id: "spread",
      title: "Point Spread",
      category: "betting_market",
      aliases: [
        "spread",
        "handicap",
        "run line",
        "puck line",
      ],
      summary:
        "A spread gives one side a points, runs or goals advantage and gives the other side a matching disadvantage.",
      explanation:
        "The favourite must win by more than the negative spread, while the underdog may win outright or lose within the positive spread. Different sports use different names, such as run line in baseball and puck line in hockey.",
      example:
        "A team backed at +4.5 covers if it wins or loses by four points or fewer.",
      warnings: [
        "Confirm whether overtime or extra innings are included.",
        "Do not confuse the standard spread with an alternate spread.",
      ],
    },

    {
      id: "alternate-spread",
      title: "Alternate Spread",
      category: "betting_market",
      aliases: [
        "alternate line",
        "alt spread",
        "protected spread",
        "safer spread",
      ],
      summary:
        "An alternate spread changes the standard handicap to provide more or less protection.",
      explanation:
        "A bettor may accept lower odds in exchange for a larger cushion. EasyRunLine commonly evaluates protected alternate lines because they can reduce the chance of losing through a moderate scoring margin.",
      example:
        "Instead of taking an underdog at +1.5, a bettor may choose +4.5 at a shorter price.",
      warnings: [
        "More protection normally produces lower odds.",
        "The exact alternate market and price must be verified.",
      ],
    },

    {
      id: "total",
      title: "Game Total",
      category: "betting_market",
      aliases: [
        "over under",
        "over/under",
        "match total",
        "game total",
      ],
      summary:
        "A total is a wager on whether the combined score will finish above or below a listed number.",
      explanation:
        "An over wins when the combined score exceeds the line. An under wins when the combined score remains below it. Settlement rules differ when the total is a whole number and the final score lands exactly on that number.",
      example:
        "Over 8.5 runs wins when the teams combine for nine or more runs.",
      warnings: [
        "Confirm whether overtime or extra innings count.",
        "Check whether the market is full game, first half, first quarter or team total.",
      ],
    },

    {
      id: "team-total",
      title: "Team Total",
      category: "betting_market",
      aliases: [
        "team points",
        "team runs",
        "team goals",
        "individual team total",
      ],
      summary:
        "A team total is a wager on one team's scoring output rather than the combined score.",
      explanation:
        "Only the selected team's score is used for settlement. Team totals may be available for the full game, first half, first quarter or another defined period.",
      example:
        "Team A over 3.5 runs wins if Team A scores at least four runs.",
      warnings: [
        "Confirm the game period.",
        "Check whether overtime or extra innings are included.",
      ],
    },

    {
      id: "first-half",
      title: "First-Half Market",
      category: "betting_market",
      aliases: [
        "first half",
        "h1",
        "1st half",
      ],
      summary:
        "A first-half market is settled using only the first half of the event.",
      explanation:
        "Full-game performance after halftime does not affect settlement. First-half analysis should rely on first-half scoring, defensive performance, starting lineups and early-game tendencies rather than only full-game statistics.",
      warnings: [
        "Confirm how the sportsbook settles a tied first half.",
        "Do not use full-game data as the only evidence.",
      ],
    },

    {
      id: "first-quarter",
      title: "First-Quarter Market",
      category: "betting_market",
      aliases: [
        "first quarter",
        "q1",
        "1st quarter",
      ],
      summary:
        "A first-quarter market is settled using only the opening quarter.",
      explanation:
        "These markets are influenced heavily by starting lineups, early pace, opening rotations and first-quarter scoring trends.",
      warnings: [
        "First-quarter markets can be more volatile because the sample is shorter.",
        "Use quarter-specific data where possible.",
      ],
    },

    {
      id: "parlay",
      title: "Parlay",
      category: "betting_strategy",
      aliases: [
        "accumulator",
        "multi bet",
        "multiple bet",
      ],
      summary:
        "A parlay combines multiple selections into one wager.",
      explanation:
        "Every included leg normally has to win for the parlay to succeed. The combined price is higher than a single bet, but the probability of winning decreases because every leg must be correct.",
      example:
        "A two-leg parlay loses when one selection wins and the other loses.",
      warnings: [
        "Adding more legs increases variance.",
        "Do not force weak selections merely to increase the price.",
      ],
    },

    {
      id: "implied-probability",
      title: "Implied Probability",
      category: "probability",
      aliases: [
        "market probability",
        "odds probability",
        "probability from odds",
      ],
      summary:
        "Implied probability converts betting odds into the chance represented by the market price.",
      explanation:
        "For decimal odds, divide one by the odds and multiply by 100. The result reflects the sportsbook price and may include bookmaker margin. It is not automatically the true probability of the outcome.",
      example:
        "Decimal odds of 2.00 represent an implied probability of 50%.",
      warnings: [
        "Bookmaker margin can inflate the combined implied probabilities.",
        "High implied probability does not automatically mean good betting value.",
      ],
    },

    {
      id: "model-probability",
      title: "Model Probability",
      category: "probability",
      aliases: [
        "true probability",
        "estimated probability",
        "model estimate",
      ],
      summary:
        "Model probability is an evidence-based estimate of how likely an outcome is.",
      explanation:
        "It should be calculated from historical data, current matchup information and a validated model. It cannot be known with certainty. EasyRunLine should not display a model probability until it has been calibrated and tested against historical outcomes.",
      warnings: [
        "Never invent a probability because an ERL Score appears high.",
        "An ERL Score is not automatically a percentage.",
      ],
    },

    {
      id: "unit",
      title: "Betting Unit",
      category: "bankroll",
      aliases: [
        "unit size",
        "one unit",
        "stake unit",
      ],
      summary:
        "A unit is a standard stake size used to measure betting performance consistently.",
      explanation:
        "Using units allows bettors with different bankrolls to compare performance without focusing only on currency amounts. One unit should represent a predetermined and affordable percentage of the bankroll.",
      example:
        "With a R5,000 bankroll, a bettor may define one unit as R50.",
      warnings: [
        "Do not increase the unit size impulsively after losses.",
        "Unit size should reflect personal risk tolerance and affordability.",
      ],
    },

    {
      id: "bankroll-management",
      title: "Bankroll Management",
      category: "bankroll",
      aliases: [
        "manage bankroll",
        "bet sizing",
        "stake management",
      ],
      summary:
        "Bankroll management is the process of controlling stake sizes to reduce the risk of major financial loss.",
      explanation:
        "A disciplined bettor decides the unit size before betting, avoids chasing losses and keeps betting funds separate from essential living expenses. Good bankroll management cannot remove variance, but it can reduce the damage caused by losing periods.",
      warnings: [
        "Never use money needed for rent, food, debt or other essential expenses.",
        "Never chase losses by increasing stakes emotionally.",
      ],
    },

    {
      id: "closing-line-value",
      title: "Closing Line Value",
      category: "betting_strategy",
      aliases: [
        "clv",
        "closing odds value",
        "beat the closing line",
      ],
      summary:
        "Closing line value compares the price taken by a bettor with the market's final price before the event starts.",
      explanation:
        "Consistently obtaining a better number than the closing market may indicate that a bettor is identifying useful information earlier. It does not guarantee that an individual bet will win.",
      example:
        "Taking +4.5 before the market moves to +3.5 gives the bettor a better spread than the closing line.",
      warnings: [
        "Closing line value should be measured over a meaningful sample.",
        "It does not guarantee profit on every wager.",
      ],
    },

    {
      id: "responsible-betting",
      title: "Responsible Betting",
      category: "responsible_betting",
      aliases: [
        "bet responsibly",
        "responsible gambling",
        "betting discipline",
      ],
      summary:
        "Responsible betting means treating wagering as a risky activity and maintaining firm financial and behavioural limits.",
      explanation:
        "Users should set affordable limits, avoid chasing losses, take breaks and seek support if betting begins affecting their finances, relationships, work or wellbeing. EasyRunLine is a research tool and cannot guarantee results.",
      warnings: [
        "Never treat any selection as guaranteed.",
        "Stop betting when it is no longer controlled or affordable.",
      ],
    },
  ];