import type {
  KnowledgeEntry,
} from "./bettingKnowledge";

export const FOOTBALL_KNOWLEDGE: KnowledgeEntry[] =
  [
    {
      id: "quarterback-rating",
      title: "Quarterback Rating",
      category: "betting_strategy",
      aliases: [
        "passer rating",
        "qb rating",
        "quarterback passer rating",
      ],
      summary:
        "Quarterback rating combines several passing statistics into one traditional efficiency measure.",
      explanation:
        "NFL passer rating uses completion percentage, yards per attempt, touchdown percentage and interception percentage. A higher rating generally indicates more efficient passing, but it does not fully capture rushing, pressure, sacks or game situation.",
      warnings: [
        "Passer rating is not the same as ESPN QBR.",
        "Use it alongside EPA, success rate and pressure data.",
      ],
    },

    {
      id: "completion-percentage",
      title: "Completion Percentage",
      category: "betting_strategy",
      aliases: [
        "completion rate",
        "passing completion percentage",
        "cmp%",
      ],
      summary:
        "Completion percentage measures the share of pass attempts completed.",
      explanation:
        "It is calculated by dividing completed passes by pass attempts. It helps describe accuracy, but short passes can produce a high completion percentage without creating strong overall offensive value.",
      warnings: [
        "Target depth and offensive scheme affect completion percentage.",
        "Do not evaluate quarterback quality from completion percentage alone.",
      ],
    },

    {
      id: "yards-per-attempt",
      title: "Passing Yards per Attempt",
      category: "betting_strategy",
      aliases: [
        "yards per attempt",
        "passing ypa",
        "ypa",
      ],
      summary:
        "Passing yards per attempt measures average passing yards gained per attempt.",
      explanation:
        "It reflects how efficiently an offence generates passing yardage. A higher figure may indicate stronger downfield production, yards after catch or both.",
      warnings: [
        "It can be distorted by a small number of explosive plays.",
        "Pressure, opponent quality and game script matter.",
      ],
    },

    {
      id: "epa-per-play",
      title: "Expected Points Added per Play",
      category: "betting_strategy",
      aliases: [
        "epa",
        "epa per play",
        "expected points added",
      ],
      summary:
        "EPA per play estimates how much each play changes a team's expected points.",
      explanation:
        "Positive EPA means a play improved the offence's expected scoring position, while negative EPA means it reduced it. EPA can evaluate passing, rushing and overall offensive efficiency while accounting for down, distance and field position.",
      warnings: [
        "EPA depends on the underlying model.",
        "Use meaningful samples and separate offence from defence.",
      ],
    },

    {
      id: "success-rate-football",
      title: "Football Success Rate",
      category: "betting_strategy",
      aliases: [
        "nfl success rate",
        "play success rate",
        "offensive success rate",
      ],
      summary:
        "Success rate measures how often a play achieves a positive result relative to the game situation.",
      explanation:
        "A successful play usually gains enough yardage to improve the offence's chance of scoring or continuing the drive. It measures consistency better than relying only on total yards.",
      warnings: [
        "Definitions can vary slightly by provider.",
        "Explosive plays may matter even when success rate is average.",
      ],
    },

    {
      id: "red-zone-efficiency",
      title: "Red-Zone Efficiency",
      category: "betting_strategy",
      aliases: [
        "red zone touchdown percentage",
        "red zone scoring",
        "red zone offense",
      ],
      summary:
        "Red-zone efficiency measures how often drives inside the opponent's 20-yard line produce touchdowns.",
      explanation:
        "Teams that consistently convert red-zone opportunities into touchdowns may outperform teams that settle for field goals. This can influence spreads, team totals and game totals.",
      warnings: [
        "Red-zone samples can be small.",
        "Defensive red-zone performance should also be considered.",
      ],
    },

    {
      id: "third-down-efficiency",
      title: "Third-Down Efficiency",
      category: "betting_strategy",
      aliases: [
        "third down conversion rate",
        "3rd down efficiency",
        "third down percentage",
      ],
      summary:
        "Third-down efficiency measures how often an offence converts third downs into first downs or touchdowns.",
      explanation:
        "Strong third-down performance helps sustain drives, increase possession time and create more scoring opportunities.",
      warnings: [
        "Third-down performance can be volatile.",
        "Early-down efficiency often provides useful supporting context.",
      ],
    },

    {
      id: "pressure-rate",
      title: "Quarterback Pressure Rate",
      category: "betting_strategy",
      aliases: [
  "pressure rate",
  "qb pressure rate",
  "quarterback pressure rate",
  "pressure percentage",
  "pass rush pressure",
],
      summary:
        "Pressure rate measures how often the quarterback is hurried, hit or forced from a clean passing situation.",
      explanation:
        "Consistent pressure can reduce passing efficiency, increase sacks and create turnover opportunities. It matters when evaluating quarterback matchups and offensive-line protection.",
      warnings: [
        "Pressure definitions vary by data provider.",
        "A mobile quarterback may respond differently from a pocket passer.",
      ],
    },

    {
      id: "sack-rate",
      title: "Sack Rate",
      category: "betting_strategy",
      aliases: [
        "qb sack percentage",
        "sacks per dropback",
        "adjusted sack rate",
      ],
      summary:
        "Sack rate measures how often passing plays end with the quarterback being sacked.",
      explanation:
        "High sack rates can stop drives, create long-yardage situations and increase turnover risk. They reflect both offensive-line protection and quarterback decision-making.",
      warnings: [
        "Sacks are influenced by play style and time to throw.",
        "Do not assign all responsibility to the offensive line.",
      ],
    },

    {
      id: "turnover-margin",
      title: "Turnover Margin",
      category: "betting_strategy",
      aliases: [
        "turnover differential",
        "takeaway giveaway margin",
        "giveaway differential",
      ],
      summary:
        "Turnover margin is takeaways minus giveaways.",
      explanation:
        "A positive margin means a team has created more turnovers than it has committed. Turnovers strongly affect field position and scoring, but short-term turnover results can be volatile.",
      example:
        "A team with 15 takeaways and 10 giveaways has a +5 turnover margin.",
      warnings: [
        "Fumble recoveries can be highly variable.",
        "Turnover margin should not be treated as fully sustainable skill.",
      ],
    },

    {
      id: "explosive-plays",
      title: "Explosive Plays",
      category: "betting_strategy",
      aliases: [
        "big plays",
        "chunk plays",
        "explosive pass plays",
        "explosive run plays",
      ],
      summary:
        "Explosive plays are large gains that quickly improve field position or create scoring opportunities.",
      explanation:
        "They are often defined using yardage thresholds, such as passes of 20 or more yards or runs of 10 or more yards. Teams that create or prevent explosive plays can affect spreads and totals significantly.",
      warnings: [
        "Definitions differ by provider.",
        "A small number of plays can heavily influence averages.",
      ],
    },

    {
      id: "yards-per-play",
      title: "Yards per Play",
      category: "betting_strategy",
      aliases: [
        "ypp",
        "offensive yards per play",
        "defensive yards per play",
      ],
      summary:
        "Yards per play measures average yardage gained or allowed on each offensive play.",
      explanation:
        "It provides a pace-independent view of offensive or defensive efficiency. Comparing offensive yards per play with opponent defensive yards allowed per play can help assess matchup strength.",
      warnings: [
        "Game script can affect play selection.",
        "Use recent and opponent-adjusted figures where possible.",
      ],
    },

    {
      id: "rushing-efficiency",
      title: "Rushing Efficiency",
      category: "betting_strategy",
      aliases: [
        "rush efficiency",
        "yards per carry",
        "rushing success rate",
      ],
      summary:
        "Rushing efficiency measures how effectively a team gains value through running plays.",
      explanation:
        "Useful measures include yards per carry, rushing EPA and rushing success rate. A productive ground game can sustain drives, control tempo and reduce pressure on the quarterback.",
      warnings: [
        "Yards per carry can be distorted by long runs.",
        "Offensive-line health and defensive front quality matter.",
      ],
    },

    {
      id: "pass-protection",
      title: "Pass Protection",
      category: "betting_strategy",
      aliases: [
        "offensive line protection",
        "pass blocking",
        "pocket protection",
      ],
      summary:
        "Pass protection describes how effectively the offensive line and blockers protect the quarterback.",
      explanation:
        "Strong protection gives receivers time to develop routes and reduces sacks or forced mistakes. Weak protection can damage passing efficiency even when the quarterback and receivers are talented.",
      warnings: [
        "Injuries and lineup changes on the offensive line matter.",
        "Protection should be compared with the opponent's pass rush.",
      ],
    },

    {
      id: "time-of-possession",
      title: "Time of Possession",
      category: "betting_strategy",
      aliases: [
        "possession time",
        "top nfl",
        "ball control time",
      ],
      summary:
        "Time of possession measures how long a team controls the ball.",
      explanation:
        "Long possessions can limit the opponent's opportunities and tire the defence. However, possession time alone does not guarantee efficient scoring.",
      warnings: [
        "Teams can score quickly without dominating possession time.",
        "Efficiency is often more important than raw possession duration.",
      ],
    },

    {
      id: "game-script-football",
      title: "Football Game Script",
      category: "betting_strategy",
      aliases: [
        "nfl game script",
        "expected game script",
        "passing game script",
      ],
      summary:
        "Game script describes how the score and expected flow influence play selection.",
      explanation:
        "Teams leading comfortably may run more often, while trailing teams may pass at a higher rate. Expected game script is important for spreads, totals and player props.",
      warnings: [
        "Actual games can develop differently from expectations.",
        "Do not treat projected script as certain.",
      ],
    },

    {
      id: "nfl-weather",
      title: "NFL Weather",
      category: "betting_strategy",
      aliases: [
        "football weather",
        "wind in nfl",
        "rain football",
        "snow football",
      ],
      summary:
        "Weather can affect passing, kicking, footing and scoring conditions.",
      explanation:
        "Strong wind is often more influential than rain alone because it can reduce deep passing efficiency and field-goal range. Snow, extreme cold and heavy rain can also affect ball handling and field conditions.",
      warnings: [
        "Weather forecasts can change.",
        "Stadium type and field surface matter.",
      ],
    },

    {
      id: "nfl-rest-travel",
      title: "NFL Rest and Travel",
      category: "betting_strategy",
      aliases: [
        "short week",
        "long week",
        "travel disadvantage nfl",
        "rest advantage nfl",
      ],
      summary:
        "Rest and travel conditions can affect preparation, recovery and performance.",
      explanation:
        "Thursday games create short preparation weeks, while bye weeks provide additional recovery time. Long travel and time-zone changes may also affect teams.",
      warnings: [
        "Rest should not be evaluated in isolation.",
        "Injury status and team depth remain important.",
      ],
    },

    {
      id: "nfl-spread",
      title: "NFL Point Spread",
      category: "betting_market",
      aliases: [
        "football spread",
        "nfl handicap",
        "nfl point spread",
      ],
      summary:
        "The NFL point spread gives one team a points advantage and the other a matching disadvantage.",
      explanation:
        "A favourite at -3.5 must win by at least four points to cover. An underdog at +3.5 covers by winning outright or losing by three points or fewer.",
      warnings: [
        "Overtime normally counts unless the market says otherwise.",
        "Whole-number spreads can result in a push.",
      ],
    },

    {
      id: "nfl-alternate-spread",
      title: "NFL Alternate Spread",
      category: "betting_market",
      aliases: [
        "football alternate spread",
        "nfl alt spread",
        "alternate nfl handicap",
      ],
      summary:
        "An NFL alternate spread changes the standard point spread to provide more or less protection.",
      explanation:
        "A larger positive spread gives the underdog more cushion but usually reduces the price. A more aggressive favourite spread increases the required winning margin.",
      warnings: [
        "More protection normally means shorter odds.",
        "Always verify the exact line and price.",
      ],
    },

    {
      id: "nfl-total",
      title: "NFL Game Total",
      category: "betting_market",
      aliases: [
        "football total",
        "nfl over under",
        "nfl total points",
      ],
      summary:
        "An NFL total is based on the combined points scored by both teams.",
      explanation:
        "Totals are influenced by offensive efficiency, pace, weather, turnovers, red-zone execution, field-goal kicking and expected game script.",
      warnings: [
        "Overtime normally counts unless stated otherwise.",
        "Late defensive scores can significantly affect totals.",
      ],
    },

    {
      id: "nfl-team-total",
      title: "NFL Team Total",
      category: "betting_market",
      aliases: [
        "football team total",
        "nfl team points",
        "team total nfl",
      ],
      summary:
        "An NFL team total is a wager on one team's points.",
      explanation:
        "Analysis should compare the selected offence with the opposing defence while considering injuries, pace, red-zone efficiency, weather and game script.",
      warnings: [
        "Quarterback and offensive-line injuries matter greatly.",
        "Confirm whether overtime counts.",
      ],
    },

    {
      id: "nfl-first-half",
      title: "NFL First-Half Market",
      category: "betting_market",
      aliases: [
        "football first half",
        "nfl first half spread",
        "nfl first half total",
        "h1 nfl",
      ],
      summary:
        "An NFL first-half market is settled using only the first two quarters.",
      explanation:
        "First-half analysis should focus on opening scripts, early-down efficiency, quarterback play, first-half scoring and defensive starts.",
      warnings: [
        "Do not rely only on full-game averages.",
        "Confirm how tied first-half markets are settled.",
      ],
    },

    {
      id: "nfl-first-quarter",
      title: "NFL First-Quarter Market",
      category: "betting_market",
      aliases: [
        "football first quarter",
        "nfl q1",
        "q1 spread nfl",
        "q1 total nfl",
      ],
      summary:
        "An NFL first-quarter market is settled using only the opening quarter.",
      explanation:
        "These markets are influenced by scripted opening drives, starting field position, early pace and defensive preparation.",
      warnings: [
        "Quarter markets are highly volatile because of the short sample.",
        "One turnover or special-teams play can dominate the result.",
      ],
    },

    {
      id: "nfl-blowout-risk",
      title: "NFL Blowout Risk",
      category: "betting_strategy",
      aliases: [
        "football blowout risk",
        "large nfl margin",
        "nfl mismatch risk",
      ],
      summary:
        "NFL blowout risk estimates the chance of a game ending with a large scoring margin.",
      explanation:
        "It can be influenced by quarterback quality, offensive-line mismatches, turnover risk, defensive efficiency, injuries and overall team-strength gaps.",
      warnings: [
        "Low blowout risk does not guarantee a spread cover.",
        "Turnovers and defensive touchdowns can quickly change margins.",
      ],
    },
  ];