import type {
  KnowledgeEntry,
} from "./bettingKnowledge";

export const SOCCER_KNOWLEDGE: KnowledgeEntry[] =
  [
    {
      id: "three-way-moneyline",
      title: "Soccer Three-Way Moneyline",
      category: "betting_market",
      aliases: [
        "3 way moneyline",
        "three way moneyline",
        "1x2",
        "match result",
        "home draw away",
      ],
      summary:
        "A three-way moneyline offers home win, draw and away win as separate outcomes.",
      explanation:
        "Unlike a two-way moneyline, a draw is not removed from the market. A home selection loses if the match finishes level or the away team wins. The market is usually settled after regulation time unless stated otherwise.",
      example:
        "In a 1X2 market, selecting Home wins only when the home team leads at the end of regulation.",
      warnings: [
        "Extra time and penalties usually do not count.",
        "Confirm whether the market is regulation-only.",
      ],
    },

    {
      id: "double-chance",
      title: "Double Chance",
      category: "betting_market",
      aliases: [
        "1x",
        "x2",
        "12 double chance",
        "home or draw",
        "away or draw",
      ],
      summary:
        "Double chance combines two of the three possible soccer results.",
      explanation:
        "Home or Draw covers a home win or a draw. Away or Draw covers an away win or a draw. Home or Away covers either team winning but loses if the match finishes level.",
      warnings: [
        "The additional protection normally produces shorter odds.",
        "Regulation-time settlement usually applies.",
      ],
    },

    {
      id: "draw-no-bet",
      title: "Draw No Bet",
      category: "betting_market",
      aliases: [
        "dnb",
        "draw no bet market",
        "money back on draw",
      ],
      summary:
        "Draw No Bet removes the draw as a losing result.",
      explanation:
        "The selected team wins the wager if it wins the match. If the match finishes level, the stake is normally returned. The bet loses when the opposing team wins.",
      warnings: [
        "Odds are usually lower than the standard three-way moneyline.",
        "Confirm regulation-time settlement.",
      ],
    },

    {
      id: "asian-handicap",
      title: "Asian Handicap",
      category: "betting_market",
      aliases: [
        "asian spread",
        "soccer asian handicap",
        "ah",
        "goal handicap",
      ],
      summary:
        "Asian handicap removes or reduces the draw by applying a goal handicap.",
      explanation:
        "Positive handicaps protect the underdog, while negative handicaps require the favourite to win by a larger margin. Whole, half and quarter-goal lines settle differently.",
      example:
        "A team at +0.5 covers by winning or drawing.",
      warnings: [
        "Quarter-goal lines split the stake across two nearby handicaps.",
        "Always confirm the exact handicap and settlement rules.",
      ],
    },

    {
      id: "quarter-goal-handicap",
      title: "Quarter-Goal Asian Handicap",
      category: "betting_market",
      aliases: [
        "+0.25",
        "-0.25",
        "+0.75",
        "-0.75",
        "quarter handicap",
      ],
      summary:
        "A quarter-goal handicap divides one stake across two adjacent Asian-handicap lines.",
      explanation:
        "For example, +0.25 splits the stake between 0 and +0.5. Depending on the final score, this can produce a full win, half win, half loss, push or full loss.",
      warnings: [
        "Quarter lines require careful settlement understanding.",
        "Do not describe every draw as a full win or full refund.",
      ],
    },

    {
      id: "btts",
      title: "Both Teams to Score",
      category: "betting_market",
      aliases: [
        "btts",
        "both teams to score",
        "both teams score",
        "gg",
      ],
      summary:
        "Both Teams to Score asks whether each team will score at least once.",
      explanation:
        "BTTS Yes wins when both teams score. BTTS No wins when one or both teams fail to score. The final number of goals beyond that does not affect settlement.",
      warnings: [
        "A high total projection does not automatically guarantee BTTS.",
        "One team can score several goals while the other scores none.",
      ],
    },

    {
      id: "soccer-total-goals",
      title: "Soccer Total Goals",
      category: "betting_market",
      aliases: [
        "soccer over under",
        "match total goals",
        "total goals",
        "over goals",
        "under goals",
      ],
      summary:
        "A soccer total is based on the combined goals scored by both teams.",
      explanation:
        "Over 2.5 requires at least three goals. Under 2.5 wins when the match finishes with zero, one or two goals.",
      warnings: [
        "Regulation time normally counts unless stated otherwise.",
        "Whole-number totals may allow pushes depending on the market type.",
      ],
    },

    {
      id: "alternate-soccer-total",
      title: "Soccer Alternate Total",
      category: "betting_market",
      aliases: [
        "alternate goals total",
        "soccer alt total",
        "over 1.5 goals",
        "under 4.5 goals",
        "protected total",
      ],
      summary:
        "An alternate soccer total changes the standard goal line to provide more or less protection.",
      explanation:
        "A lower over such as Over 1.5 requires fewer goals than Over 2.5, but usually offers shorter odds. A higher under such as Under 4.5 provides more protection than Under 2.5.",
      warnings: [
        "More protection normally means lower odds.",
        "The exact alternate total must be available at the sportsbook.",
      ],
    },

    {
      id: "soccer-team-total",
      title: "Soccer Team Total",
      category: "betting_market",
      aliases: [
        "team total goals",
        "team goals over under",
        "home team total",
        "away team total",
      ],
      summary:
        "A soccer team total is based only on one team's goals.",
      explanation:
        "The opponent's scoring does not directly affect settlement. Analysis should focus on the selected team's chance creation, finishing and the opponent's defensive record.",
      example:
        "Home Team Over 1.5 wins when the home team scores at least two goals.",
      warnings: [
        "Confirm whether the market includes regulation time only.",
        "Team lineup changes can materially affect scoring potential.",
      ],
    },

    {
      id: "soccer-first-half",
      title: "Soccer First-Half Market",
      category: "betting_market",
      aliases: [
        "soccer first half",
        "first half soccer",
        "h1 soccer",
        "first half result",
      ],
      summary:
        "A soccer first-half market is settled using only the opening half.",
      explanation:
        "First-half analysis should consider opening tempo, early scoring patterns, tactical starts and first-half defensive performance rather than relying only on full-match statistics.",
      warnings: [
        "Second-half goals do not affect settlement.",
        "Confirm how first-half stoppage time is handled.",
      ],
    },

    {
      id: "soccer-first-half-total",
      title: "Soccer First-Half Total",
      category: "betting_market",
      aliases: [
        "first half goals",
        "first half over under",
        "h1 total goals",
        "first half total soccer",
      ],
      summary:
        "A first-half total is based on goals scored before halftime.",
      explanation:
        "The market is influenced by first-half scoring rates, tactical caution, early pressing and the likelihood of a fast or slow start.",
      warnings: [
        "Full-match scoring averages may not reflect first-half behaviour.",
        "A late second-half goal cannot rescue a first-half over.",
      ],
    },

    {
      id: "expected-goals-soccer",
      title: "Expected Goals",
      category: "betting_strategy",
      aliases: [
        "xg",
        "soccer expected goals",
        "expected goals soccer",
      ],
      summary:
        "Expected goals estimate the quality of scoring chances.",
      explanation:
        "Each shot receives a probability of becoming a goal based on factors such as location, angle, body part and assist type. The values are added to estimate the quality of chances created.",
      warnings: [
        "xG is a model estimate, not a guarantee of goals.",
        "Different providers may calculate xG differently.",
      ],
    },

    {
      id: "expected-goals-against",
      title: "Expected Goals Against",
      category: "betting_strategy",
      aliases: [
        "xga",
        "expected goals against",
        "soccer xga",
      ],
      summary:
        "Expected goals against estimate the quality of chances a team allows.",
      explanation:
        "A lower xGA generally indicates that a team limits opponents to fewer or lower-quality scoring opportunities.",
      warnings: [
        "Goalkeeper performance can cause actual goals allowed to differ from xGA.",
        "Use meaningful samples and opponent context.",
      ],
    },

    {
      id: "expected-points",
      title: "Expected Points",
      category: "betting_strategy",
      aliases: [
        "xpoints",
        "xp soccer",
        "expected league points",
      ],
      summary:
        "Expected points estimate how many league points a team's performances may have deserved.",
      explanation:
        "Models use factors such as expected goals to estimate the likelihood of a win, draw or loss and convert those probabilities into expected points.",
      warnings: [
        "Expected points are model-based estimates.",
        "They do not replace actual league standings.",
      ],
    },

    {
      id: "ppda",
      title: "PPDA",
      category: "betting_strategy",
      aliases: [
        "passes per defensive action",
        "pressing intensity",
        "soccer ppda",
      ],
      summary:
        "PPDA estimates how aggressively a team presses the opponent.",
      explanation:
        "It measures how many passes the opponent completes before the defending team attempts a defensive action in selected areas. A lower PPDA usually indicates more aggressive pressing.",
      warnings: [
        "Definitions may vary by provider.",
        "Low PPDA does not automatically mean better overall defence.",
      ],
    },

    {
      id: "possession",
      title: "Possession",
      category: "betting_strategy",
      aliases: [
        "ball possession",
        "possession percentage",
        "soccer possession",
      ],
      summary:
        "Possession measures the share of time or actions in which a team controls the ball.",
      explanation:
        "High possession may indicate territorial control, but it does not automatically mean better chances or more goals. Some teams intentionally concede possession and attack quickly in transition.",
      warnings: [
        "Possession without chance quality can be misleading.",
        "Game state strongly affects possession.",
      ],
    },

    {
      id: "shots-on-target-soccer",
      title: "Soccer Shots on Target",
      category: "betting_strategy",
      aliases: [
        "shots on target",
        "sot soccer",
        "on target shots",
      ],
      summary:
        "A shot on target would enter the goal without goalkeeper intervention.",
      explanation:
        "Shots that miss the goal or are blocked before reaching the goal are not normally counted as shots on target.",
      warnings: [
        "Official data providers may make different scoring decisions.",
        "Shot volume should be considered alongside shot quality.",
      ],
    },

    {
      id: "big-chances",
      title: "Big Chances",
      category: "betting_strategy",
      aliases: [
        "big chance",
        "clear cut chances",
        "major scoring chances",
      ],
      summary:
        "Big chances are opportunities where a player would reasonably be expected to score.",
      explanation:
        "They often include close-range shots, one-on-one situations and clear headers. Frequent big-chance creation can indicate stronger attacking quality than total shots alone.",
      warnings: [
        "Definitions vary between providers.",
        "Finishing remains volatile over short samples.",
      ],
    },

    {
      id: "shot-conversion",
      title: "Shot Conversion Rate",
      category: "betting_strategy",
      aliases: [
        "conversion rate",
        "goal conversion",
        "shots to goals percentage",
      ],
      summary:
        "Shot conversion rate measures how often shots become goals.",
      explanation:
        "It can highlight strong or weak finishing, but unusually high conversion may fall over time if chance quality does not support it.",
      warnings: [
        "Small samples are highly volatile.",
        "Compare conversion with xG and shot quality.",
      ],
    },

    {
      id: "clean-sheet",
      title: "Clean Sheet",
      category: "betting_strategy",
      aliases: [
        "clean sheets",
        "shutout soccer",
        "not concede",
      ],
      summary:
        "A clean sheet occurs when a team allows no goals.",
      explanation:
        "Clean-sheet performance depends on defensive structure, goalkeeper quality, opponent attack and game state.",
      warnings: [
        "A strong clean-sheet record can be influenced by weak opposition.",
        "One defensive error can change the result.",
      ],
    },

    {
      id: "goal-difference",
      title: "Goal Difference",
      category: "betting_strategy",
      aliases: [
        "goals difference",
        "goal differential",
        "goals scored minus conceded",
      ],
      summary:
        "Goal difference is goals scored minus goals conceded.",
      explanation:
        "A positive goal difference indicates that a team has scored more goals than it has allowed. It is useful for assessing overall performance and is often used as a standings tiebreaker.",
      warnings: [
        "Large wins can distort small samples.",
        "Expected-goal difference may provide additional context.",
      ],
    },

    {
      id: "high-press",
      title: "High Press",
      category: "betting_strategy",
      aliases: [
        "high pressing",
        "press high",
        "aggressive press",
      ],
      summary:
        "A high press attempts to regain possession close to the opponent's goal.",
      explanation:
        "It can create turnovers and quick chances but may leave space behind the pressing players if the opponent escapes.",
      warnings: [
        "Pressing requires energy and coordination.",
        "Fixture congestion can reduce pressing intensity.",
      ],
    },

    {
      id: "low-block",
      title: "Low Block",
      category: "betting_strategy",
      aliases: [
        "deep defensive block",
        "sit deep",
        "defensive low block",
      ],
      summary:
        "A low block is a compact defensive structure positioned close to a team's own goal.",
      explanation:
        "It reduces space near the penalty area and can make central chance creation difficult. It may also concede possession and invite crosses or long-range shots.",
      warnings: [
        "A low block can still fail through set pieces or individual mistakes.",
        "Possession dominance against a low block does not guarantee goals.",
      ],
    },

    {
      id: "counter-attack",
      title: "Counter-Attack",
      category: "betting_strategy",
      aliases: [
        "counter attacking",
        "fast break soccer",
        "transition attack",
      ],
      summary:
        "A counter-attack is a rapid attack after regaining possession.",
      explanation:
        "Counter-attacking teams exploit space left by opponents who commit players forward. Speed, direct passing and decision-making are important.",
      warnings: [
        "Counter-attacking opportunities depend on game state.",
        "Teams facing a deep defence may have fewer transition chances.",
      ],
    },

    {
      id: "set-pieces",
      title: "Set Pieces",
      category: "betting_strategy",
      aliases: [
        "corners and free kicks",
        "dead ball situations",
        "set piece goals",
      ],
      summary:
        "Set pieces include corners, free kicks, penalties and structured restarts.",
      explanation:
        "Strong delivery, aerial ability and rehearsed routines can create goals even when open-play chance creation is limited.",
      warnings: [
        "Set-piece conversion can be volatile.",
        "Personnel availability matters.",
      ],
    },

    {
      id: "fixture-congestion",
      title: "Fixture Congestion",
      category: "betting_strategy",
      aliases: [
        "busy schedule",
        "congested fixtures",
        "many games in few days",
      ],
      summary:
        "Fixture congestion occurs when a team plays several matches within a short period.",
      explanation:
        "It can affect fatigue, squad rotation, pressing intensity and late-match performance, especially when travel is involved.",
      warnings: [
        "Deep squads may handle congestion better.",
        "Check expected rotation rather than assuming all starters will play.",
      ],
    },

    {
      id: "squad-rotation",
      title: "Squad Rotation",
      category: "betting_strategy",
      aliases: [
        "rotated lineup",
        "team rotation",
        "resting players",
      ],
      summary:
        "Squad rotation means changing the starting lineup to manage workload or tactics.",
      explanation:
        "Rotation can affect team chemistry, attacking quality and defensive organisation. The effect depends on squad depth and the quality of replacement players.",
      warnings: [
        "Do not assume rotation automatically weakens a team.",
        "Confirmed lineups are important for live analysis.",
      ],
    },

    {
      id: "home-advantage-soccer",
      title: "Soccer Home Advantage",
      category: "betting_strategy",
      aliases: [
        "home form soccer",
        "home field advantage soccer",
        "home team advantage",
      ],
      summary:
        "Home advantage refers to benefits associated with playing at a team's own stadium.",
      explanation:
        "Familiar surroundings, crowd support, reduced travel and officiating effects may contribute. The strength of home advantage varies by team and league.",
      warnings: [
        "Home advantage alone is not enough to justify a bet.",
        "Compare home performance with opponent away performance.",
      ],
    },

    {
      id: "away-form-soccer",
      title: "Soccer Away Form",
      category: "betting_strategy",
      aliases: [
        "away record soccer",
        "road form soccer",
        "away performance",
      ],
      summary:
        "Away form measures performance when a team plays outside its home stadium.",
      explanation:
        "Travel, tactical caution and reduced crowd support can affect performance. Some teams maintain similar standards away, while others decline significantly.",
      warnings: [
        "Opponent quality should be considered.",
        "Small away samples can mislead.",
      ],
    },

    {
      id: "promotion-relegation",
      title: "Promotion and Relegation",
      category: "betting_strategy",
      aliases: [
        "promotion",
        "relegation",
        "relegation battle",
        "promoted team",
      ],
      summary:
        "Promotion moves teams to a higher division, while relegation moves teams to a lower division.",
      explanation:
        "League structures commonly promote strong lower-division teams and relegate weak top-division teams. Newly promoted clubs may face stronger opposition and different financial or squad demands.",
      warnings: [
        "Promotion and relegation rules differ by competition.",
        "New teams and logos should be loaded dynamically where possible.",
      ],
    },
  ];