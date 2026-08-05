import type {
  KnowledgeEntry,
} from "./bettingKnowledge";

export const BASEBALL_KNOWLEDGE: KnowledgeEntry[] =
  [
    {
      id: "whip",
      title: "WHIP",
      category: "betting_strategy",
      aliases: [
        "walks and hits per inning pitched",
        "walks plus hits per inning pitched",
      ],
      summary:
        "WHIP measures how many walks and hits a pitcher allows per inning.",
      explanation:
        "WHIP stands for Walks plus Hits per Inning Pitched. It is calculated by adding walks and hits allowed, then dividing by innings pitched. A lower WHIP generally means the pitcher allows fewer baserunners and controls innings more effectively.",
      example:
        "A pitcher who allows four hits and two walks across six innings has a WHIP of 1.00.",
      warnings: [
        "WHIP does not include runners who reach base through errors or hit-by-pitches.",
        "Use WHIP alongside ERA, strikeout rate and walk rate rather than by itself.",
      ],
    },

    {
      id: "era",
      title: "Earned Run Average",
      category: "betting_strategy",
      aliases: [
        "era",
        "earned run average",
      ],
      summary:
        "ERA estimates how many earned runs a pitcher allows per nine innings.",
      explanation:
        "Earned Run Average measures earned runs allowed relative to innings pitched and scales the result to nine innings. A lower ERA is generally better, but ERA can be influenced by defence, ballpark conditions and sequencing.",
      example:
        "A pitcher who allows two earned runs in six innings has a game ERA equivalent of 3.00.",
      warnings: [
        "ERA can hide underlying control or contact problems.",
        "Compare ERA with WHIP, FIP and recent performance.",
      ],
    },

    {
      id: "fip",
      title: "Fielding Independent Pitching",
      category: "betting_strategy",
      aliases: [
        "fip",
        "fielding independent pitching",
      ],
      summary:
        "FIP estimates pitching performance using outcomes the pitcher controls most directly.",
      explanation:
        "FIP focuses mainly on strikeouts, walks, hit batters and home runs. It attempts to reduce the influence of team defence and balls in play when evaluating a pitcher.",
      warnings: [
        "FIP is an estimate rather than a direct record of runs allowed.",
        "It should be compared with ERA rather than replacing ERA completely.",
      ],
    },

    {
      id: "xera",
      title: "Expected ERA",
      category: "betting_strategy",
      aliases: [
        "xera",
        "expected era",
      ],
      summary:
        "Expected ERA estimates what a pitcher's ERA might be based on the quality of contact and other underlying outcomes.",
      explanation:
        "xERA uses underlying information such as strikeouts, walks and contact quality to estimate expected run prevention. It can help identify pitchers whose current ERA may be better or worse than their underlying performance suggests.",
      warnings: [
        "Different data providers may calculate expected ERA differently.",
        "Expected statistics are estimates and should not be treated as guarantees.",
      ],
    },

    {
      id: "babip",
      title: "BABIP",
      category: "betting_strategy",
      aliases: [
        "batting average on balls in play",
      ],
      summary:
        "BABIP measures how often balls put into play become hits.",
      explanation:
        "Batting Average on Balls in Play excludes home runs and strikeouts. It can help evaluate whether a pitcher or hitter may have experienced unusually favourable or unfavourable results on balls in play.",
      warnings: [
        "BABIP is affected by defence, contact quality and player skill.",
        "Do not assume every unusually high or low BABIP is purely luck.",
      ],
    },

    {
      id: "obp",
      title: "On-Base Percentage",
      category: "betting_strategy",
      aliases: [
        "obp",
        "on base percentage",
        "on-base percentage",
      ],
      summary:
        "On-base percentage measures how often a hitter reaches base.",
      explanation:
        "OBP includes hits, walks and hit-by-pitches. It is often more informative than batting average alone because it rewards hitters who reach base without recording a hit.",
      warnings: [
        "OBP does not measure the power or value of each hit.",
        "Use it alongside slugging percentage and OPS.",
      ],
    },

    {
      id: "slugging-percentage",
      title: "Slugging Percentage",
      category: "betting_strategy",
      aliases: [
        "slugging",
        "slg",
        "slugging percentage",
      ],
      summary:
        "Slugging percentage measures total bases per at-bat.",
      explanation:
        "Slugging percentage gives more weight to extra-base hits than singles. A double counts as two total bases, a triple as three and a home run as four.",
      example:
        "A hitter with one double in four at-bats has a slugging percentage of .500 for that sample.",
      warnings: [
        "Slugging percentage does not include walks.",
        "Small samples can create large short-term swings.",
      ],
    },

    {
      id: "ops",
      title: "OPS",
      category: "betting_strategy",
      aliases: [
        "on base plus slugging",
        "on-base plus slugging",
      ],
      summary:
        "OPS combines on-base percentage and slugging percentage.",
      explanation:
        "OPS gives a broad view of how well a hitter reaches base and hits for power. It is calculated by adding OBP and slugging percentage.",
      warnings: [
        "OPS does not adjust automatically for ballpark or league conditions.",
        "OPS should not be used as the only measure of offensive quality.",
      ],
    },

    {
      id: "starting-pitcher",
      title: "Starting Pitcher",
      category: "betting_strategy",
      aliases: [
        "starter",
        "starting pitching",
        "starting pitcher matchup",
      ],
      summary:
        "The starting pitcher controls most of the early innings and strongly influences First 5 markets.",
      explanation:
        "Starting pitchers typically work the opening portion of a game. Their ability to limit baserunners, strike out hitters and avoid walks or home runs can determine whether a team remains competitive early.",
      warnings: [
        "Always verify the confirmed starter before using the analysis.",
        "A late pitching change can significantly alter the matchup.",
      ],
    },

    {
      id: "bullpen",
      title: "Bullpen",
      category: "betting_strategy",
      aliases: [
        "relief pitchers",
        "relief pitching",
      ],
      summary:
        "The bullpen is the group of relief pitchers used after the starting pitcher leaves.",
      explanation:
        "Bullpen quality affects the later innings of a game. A strong starter may keep a game close early, but an overworked or ineffective bullpen can allow late runs and change the full-game result.",
      warnings: [
        "Bullpen usage over the previous several days matters.",
        "Closer and setup-reliever availability should be checked.",
      ],
    },

    {
      id: "bullpen-fatigue",
      title: "Bullpen Fatigue",
      category: "betting_strategy",
      aliases: [
        "tired bullpen",
        "bullpen workload",
        "overworked bullpen",
      ],
      summary:
        "Bullpen fatigue measures whether key relief pitchers may be less available or effective because of recent workload.",
      explanation:
        "Relievers who have pitched on consecutive days or thrown many pitches may be unavailable or less effective. Bullpen fatigue is especially important for full-game run lines, moneylines and totals.",
      warnings: [
        "Team bullpen ERA alone does not show current availability.",
        "Check recent innings and pitch counts where possible.",
      ],
    },

    {
      id: "quality-start",
      title: "Quality Start",
      category: "betting_strategy",
      aliases: [
        "quality starts",
        "qs",
      ],
      summary:
        "A quality start occurs when a starting pitcher completes at least six innings and allows no more than three earned runs.",
      explanation:
        "The statistic is used to measure whether a starter gave the team a reasonably competitive outing. It does not necessarily mean the pitcher dominated or that the team won.",
      warnings: [
        "A quality start does not account for run support.",
        "The threshold can still represent a 4.50 ERA pace.",
      ],
    },

    {
      id: "strikeout-walk-ratio",
      title: "Strikeout-to-Walk Ratio",
      category: "betting_strategy",
      aliases: [
        "k bb ratio",
        "k/bb",
        "strikeout to walk ratio",
      ],
      summary:
        "Strikeout-to-walk ratio compares a pitcher's strikeouts with walks allowed.",
      explanation:
        "A higher ratio generally indicates better command and control. Pitchers who record many strikeouts while issuing few walks create fewer free baserunners and can escape trouble more effectively.",
      warnings: [
        "The ratio does not directly measure home-run prevention.",
        "Compare season-long and recent figures.",
      ],
    },

    {
      id: "run-differential",
      title: "Run Differential",
      category: "betting_strategy",
      aliases: [
        "runs differential",
        "run difference",
      ],
      summary:
        "Run differential is runs scored minus runs allowed.",
      explanation:
        "Positive run differential means a team has scored more runs than it has conceded. Recent run differential can help measure whether a team has been competitive even when its win-loss record is weak.",
      example:
        "A team that scores 45 runs and allows 38 has a +7 run differential.",
      warnings: [
        "A few blowout results can distort a small sample.",
        "Separate recent form from full-season performance.",
      ],
    },

    {
      id: "one-run-games",
      title: "One-Run Games",
      category: "betting_strategy",
      aliases: [
        "one run game",
        "one-run record",
        "close games",
      ],
      summary:
        "One-run game performance tracks results in games decided by exactly one run.",
      explanation:
        "This record can show how frequently a team plays close games. It may also reflect bullpen execution, late-game offence and short-term variance.",
      warnings: [
        "One-run records can fluctuate significantly.",
        "Do not treat a strong one-run record as permanent skill without supporting evidence.",
      ],
    },

    {
      id: "first-five-innings",
      title: "First 5 Innings",
      category: "betting_market",
      aliases: [
        "f5",
        "first five",
        "first 5",
        "first five innings",
      ],
      summary:
        "A First 5 Innings market is settled using only the first five innings.",
      explanation:
        "F5 analysis places greater emphasis on the starting pitchers and early offence. Bullpen performance after the fifth inning does not affect settlement.",
      warnings: [
        "Check the sportsbook's tie and push rules.",
        "Do not give normal bullpen data major weight in an F5 recommendation.",
      ],
    },

    {
      id: "run-line",
      title: "Baseball Run Line",
      category: "betting_market",
      aliases: [
        "baseball spread",
        "mlb run line",
      ],
      summary:
        "The run line is baseball's spread market.",
      explanation:
        "The favourite receives a negative run handicap and the underdog receives a positive run handicap. EasyRunLine often evaluates protected alternate run lines such as underdog +4.5.",
      warnings: [
        "Confirm whether extra innings are included.",
        "Standard +1.5 and alternate +4.5 are different markets.",
      ],
    },

    {
      id: "total-bases",
      title: "Total Bases",
      category: "betting_market",
      aliases: [
        "batter total bases",
        "player total bases",
      ],
      summary:
        "Total bases count the bases a hitter earns from hits.",
      explanation:
        "A single counts as one total base, a double as two, a triple as three and a home run as four. Walks, errors, stolen bases and hit-by-pitches do not count.",
      example:
        "Two singles equal two total bases. One home run equals four.",
      warnings: [
        "Only official hits count.",
        "Confirm whether the player must start or record a plate appearance under the sportsbook's rules.",
      ],
    },

    {
      id: "pitcher-outs",
      title: "Pitcher Outs Recorded",
      category: "betting_market",
      aliases: [
        "pitching outs",
        "outs recorded",
        "pitcher out prop",
      ],
      summary:
        "Pitcher outs recorded count how many batting outs a pitcher completes.",
      explanation:
        "Each full inning equals three outs. Five complete innings equal fifteen outs, while 5.1 innings equal sixteen outs and 5.2 innings equal seventeen.",
      example:
        "A pitcher who completes six innings records eighteen outs.",
      warnings: [
        "A pitcher can leave during an inning.",
        "Rain delays, injury and pitch-count limitations can affect this market.",
      ],
    },
  ];