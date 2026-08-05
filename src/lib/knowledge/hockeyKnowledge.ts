import type {
  KnowledgeEntry,
} from "./bettingKnowledge";

export const HOCKEY_KNOWLEDGE: KnowledgeEntry[] =
  [
    {
      id: "puck-line",
      title: "Puck Line",
      category: "betting_market",
      aliases: [
        "hockey spread",
        "nhl spread",
        "standard puck line",
      ],
      summary:
        "The puck line is hockey's standard spread market.",
      explanation:
        "The favourite is commonly listed at -1.5 goals, while the underdog receives +1.5 goals. The favourite must win by at least two goals to cover -1.5. The underdog covers +1.5 by winning outright or losing by exactly one goal.",
      example:
        "An NHL underdog at +1.5 covers after a 3–2 loss.",
      warnings: [
        "Overtime normally counts in full-game puck-line markets unless stated otherwise.",
        "Confirm whether the market is regulation-only or includes overtime and shootouts.",
      ],
    },

    {
      id: "alternate-puck-line",
      title: "Alternate Puck Line",
      category: "betting_market",
      aliases: [
        "nhl alternate line",
        "alternate hockey spread",
        "hockey alt line",
        "plus 2.5 puck line",
        "+2.5 puck line",
      ],
      summary:
        "An alternate puck line changes the standard hockey spread to provide more or less protection.",
      explanation:
        "A bettor may choose an underdog at +2.5 instead of the standard +1.5. This gives more protection against a multi-goal loss but normally produces shorter odds.",
      example:
        "An underdog at +2.5 covers if it wins or loses by one or two goals.",
      warnings: [
        "More protection normally means a lower potential return.",
        "Always verify the exact line and price offered by the sportsbook.",
      ],
    },

    {
      id: "goalie-save-percentage",
      title: "Goalie Save Percentage",
      category: "betting_strategy",
      aliases: [
        "save percentage",
        "sv%",
        "goalie sv%",
        "goalie save rate",
      ],
      summary:
        "Save percentage measures the share of shots on goal stopped by a goalie.",
      explanation:
        "It is calculated by dividing saves by shots faced. A higher save percentage generally indicates stronger goal prevention, although team defence, shot quality and sample size also influence the result.",
      example:
        "A goalie who stops 27 of 30 shots has a .900 save percentage.",
      warnings: [
        "Save percentage does not account fully for shot difficulty.",
        "Recent form should be compared with the goalie's longer-term record.",
      ],
    },

    {
      id: "goals-against-average",
      title: "Goals-Against Average",
      category: "betting_strategy",
      aliases: [
        "gaa",
        "goals against average",
      ],
      summary:
        "Goals-against average estimates how many goals a goalie allows per 60 minutes.",
      explanation:
        "A lower GAA generally indicates fewer goals allowed, but the statistic is influenced by team defence, penalty killing and the quality of shots faced.",
      warnings: [
        "GAA is not purely an individual goalie statistic.",
        "Use it alongside save percentage and expected-goals data.",
      ],
    },

    {
      id: "goals-saved-above-expected",
      title: "Goals Saved Above Expected",
      category: "betting_strategy",
      aliases: [
        "gsae",
        "goals saved above expected",
        "goalie goals saved above expected",
      ],
      summary:
        "Goals Saved Above Expected estimates how many goals a goalie prevented compared with the quality of shots faced.",
      explanation:
        "A positive figure suggests the goalie stopped more goals than an average goalie would be expected to stop against the same shots. A negative figure suggests below-expected performance.",
      warnings: [
        "Different providers may calculate expected goals differently.",
        "Short samples can produce large swings.",
      ],
    },

    {
      id: "expected-goals-hockey",
      title: "Hockey Expected Goals",
      category: "betting_strategy",
      aliases: [
        "hockey xg",
        "nhl xg",
        "expected goals hockey",
        "expected goals in hockey",
      ],
      summary:
        "Expected goals estimate the quality of scoring chances rather than counting every shot equally.",
      explanation:
        "An expected-goals model assigns each shot a probability of becoming a goal based on factors such as shot location, angle, type and game situation. The values are added to estimate total chance quality.",
      warnings: [
        "Expected goals are model estimates, not guaranteed future goals.",
        "Different data providers can produce different xG values.",
      ],
    },

    {
      id: "corsi",
      title: "Corsi",
      category: "betting_strategy",
      aliases: [
        "corsi percentage",
        "cf%",
        "shot attempt share",
      ],
      summary:
        "Corsi measures the share of all shot attempts controlled by a team.",
      explanation:
        "It includes shots on goal, missed shots and blocked shots. A team with a Corsi percentage above 50% generated more shot attempts than it allowed during the measured situations.",
      warnings: [
        "Shot-attempt volume does not automatically mean high shot quality.",
        "Score effects can influence possession metrics.",
      ],
    },

    {
      id: "fenwick",
      title: "Fenwick",
      category: "betting_strategy",
      aliases: [
        "fenwick percentage",
        "ff%",
        "unblocked shot attempts",
      ],
      summary:
        "Fenwick measures unblocked shot attempts controlled by a team.",
      explanation:
        "It includes shots on goal and missed shots but excludes blocked attempts. It is often used as another measure of territorial control and offensive pressure.",
      warnings: [
        "Fenwick does not directly measure shot quality.",
        "Use it with expected goals and scoring-chance data.",
      ],
    },

    {
      id: "pdo",
      title: "PDO",
      category: "betting_strategy",
      aliases: [
        "shooting plus save percentage",
        "nhl pdo",
      ],
      summary:
        "PDO combines a team's shooting percentage and save percentage.",
      explanation:
        "It is often used to identify unusually favourable or unfavourable finishing and goaltending results. Values far above or below the usual range may move closer to normal over time, but team skill still matters.",
      warnings: [
        "Do not assume every high PDO team is simply lucky.",
        "Use meaningful samples and supporting metrics.",
      ],
    },

    {
      id: "power-play",
      title: "Power Play",
      category: "betting_strategy",
      aliases: [
        "power play percentage",
        "pp%",
        "man advantage",
      ],
      summary:
        "A power play occurs when one team has more skaters because the opponent has a player serving a penalty.",
      explanation:
        "Power-play efficiency measures how often a team scores during these advantages. Strong power-play units can increase totals and punish teams with weak penalty killing.",
      warnings: [
        "Power-play opportunities vary from game to game.",
        "Recent personnel changes can affect special-teams performance.",
      ],
    },

    {
      id: "penalty-kill",
      title: "Penalty Kill",
      category: "betting_strategy",
      aliases: [
        "penalty killing",
        "pk%",
        "short handed defence",
      ],
      summary:
        "The penalty kill is a team's defensive performance while playing with fewer skaters.",
      explanation:
        "Penalty-kill percentage measures how often a team prevents a power-play goal. A weak penalty kill can create significant risk against an opponent with a strong power play.",
      warnings: [
        "Raw percentage does not show the quality of chances allowed.",
        "Discipline and penalty frequency also matter.",
      ],
    },

    {
      id: "shots-on-goal-hockey",
      title: "Hockey Shots on Goal",
      category: "betting_strategy",
      aliases: [
        "nhl shots on goal",
        "hockey sog",
        "team shots",
        "player shots on goal",
      ],
      summary:
        "A shot on goal is a shot that would enter the net if the goalie did not stop it.",
      explanation:
        "Shots that miss the net or are blocked before reaching the goalie are not recorded as shots on goal. Shot volume can indicate offensive pressure but should be considered with shot quality.",
      warnings: [
        "Official scoring decisions can affect player shot totals.",
        "High shot volume does not guarantee goals.",
      ],
    },

    {
      id: "high-danger-chances",
      title: "High-Danger Chances",
      category: "betting_strategy",
      aliases: [
        "high danger scoring chances",
        "hd chances",
        "danger chances",
      ],
      summary:
        "High-danger chances are scoring opportunities from areas or situations associated with a greater chance of producing goals.",
      explanation:
        "They often include attempts near the net, rebounds and close-range opportunities. Teams creating more high-danger chances may have a stronger offensive process than raw shot totals suggest.",
      warnings: [
        "Providers may define high-danger areas differently.",
        "Finishing and goaltending still influence actual goals.",
      ],
    },

    {
      id: "empty-net-goal",
      title: "Empty-Net Goal",
      category: "betting_strategy",
      aliases: [
        "empty net",
        "goalie pulled",
        "pulled goalie",
      ],
      summary:
        "An empty-net goal is scored after a team removes its goalie for an extra attacker.",
      explanation:
        "Teams often pull the goalie late when trailing. This creates a greater chance of scoring an equaliser but also leaves the net unprotected. Empty-net goals can turn a one-goal game into a two-goal result and affect puck-line settlements.",
      warnings: [
        "A competitive one-goal game can still finish with a larger final margin.",
        "Empty-net risk matters when evaluating underdog +1.5 and favourite -1.5.",
      ],
    },

    {
      id: "confirmed-starting-goalie",
      title: "Confirmed Starting Goalie",
      category: "betting_strategy",
      aliases: [
        "starting goalie",
        "confirmed goalie",
        "projected goalie",
        "goalie confirmation",
      ],
      summary:
        "The starting goalie is the goaltender expected to begin the game.",
      explanation:
        "Goalie quality has a major effect on NHL moneylines, puck lines and totals. A projected goalie is not the same as a confirmed starter, so analysis should clearly state the confirmation status.",
      warnings: [
        "A late goalie change can significantly alter the matchup.",
        "Do not present a projected goalie as confirmed.",
      ],
    },

    {
      id: "goalie-back-to-back",
      title: "Goalie Back-to-Back",
      category: "betting_strategy",
      aliases: [
        "goalie on back to back",
        "goalie consecutive nights",
        "goalie rest",
      ],
      summary:
        "A goalie back-to-back refers to starting on consecutive days or with very limited rest.",
      explanation:
        "Limited recovery may affect performance, although teams frequently use backup goalies during back-to-back scheduling. Confirming the starter is therefore especially important.",
      warnings: [
        "Do not assume the same goalie will start both games.",
        "Travel and recent workload should also be considered.",
      ],
    },

    {
      id: "nhl-back-to-back",
      title: "NHL Back-to-Back Games",
      category: "betting_strategy",
      aliases: [
        "hockey back to back",
        "nhl b2b",
        "second night of a back to back",
      ],
      summary:
        "An NHL back-to-back occurs when a team plays on consecutive days.",
      explanation:
        "Back-to-back scheduling can influence fatigue, travel, goalie selection, defensive execution and late-game performance.",
      warnings: [
        "Rest disadvantage should not be evaluated in isolation.",
        "Check whether the opponent is also playing with limited rest.",
      ],
    },

    {
      id: "home-ice-advantage",
      title: "Home-Ice Advantage",
      category: "betting_strategy",
      aliases: [
        "home ice",
        "nhl home advantage",
      ],
      summary:
        "Home-ice advantage refers to benefits associated with playing at the home arena.",
      explanation:
        "The home team receives the final line change before faceoffs, allowing coaches to seek favourable matchups. Familiar surroundings, reduced travel and crowd support may also contribute.",
      warnings: [
        "Home ice alone is not enough to justify a selection.",
        "Team quality and goalie matchups remain important.",
      ],
    },

    {
      id: "faceoff-percentage",
      title: "Faceoff Percentage",
      category: "betting_strategy",
      aliases: [
        "faceoff win percentage",
        "faceoff rate",
        "fo%",
      ],
      summary:
        "Faceoff percentage measures how often a team or player wins faceoffs.",
      explanation:
        "Winning a faceoff can create immediate possession, especially during power plays, penalty kills and late-game situations. However, overall possession quality matters more than faceoff percentage alone.",
      warnings: [
        "Faceoff results should not be heavily weighted by themselves.",
        "Zone location and game situation affect their importance.",
      ],
    },

    {
      id: "nhl-game-total",
      title: "NHL Game Total",
      category: "betting_market",
      aliases: [
        "hockey total",
        "nhl over under",
        "nhl total goals",
      ],
      summary:
        "An NHL total is based on the combined goals scored by both teams.",
      explanation:
        "Totals are influenced by starting goalies, expected-goals creation, special teams, shot quality, pace, injuries and empty-net risk.",
      warnings: [
        "Confirm whether overtime and shootouts count.",
        "A shootout winner may be recorded differently depending on sportsbook rules.",
      ],
    },

    {
      id: "nhl-team-total",
      title: "NHL Team Total",
      category: "betting_market",
      aliases: [
        "hockey team total",
        "nhl team goals",
        "team total goals hockey",
      ],
      summary:
        "An NHL team total is a wager on one team's goals.",
      explanation:
        "The analysis should compare the selected team's offensive process with the opponent's goalie, defensive structure and penalty kill.",
      warnings: [
        "Confirm whether overtime counts.",
        "Starting-goalie changes can significantly affect the market.",
      ],
    },
  ];