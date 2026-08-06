import type {
  KnowledgeMatch,
} from "@/lib/knowledge/knowledgeRouter";

export type ReasoningMode =
  | "definition"
  | "comparison"
  | "market_choice"
  | "factor_importance"
  | "strategy_explanation"
  | "general_explanation";

export type ReasoningPlan = {
  mode: ReasoningMode;
  title: string;
  instructions: string[];
  sections: string[];
  languageRules: string[];
  knowledgeIds: string[];
};

function includesAny(
  text: string,
  phrases: string[]
) {
  return phrases.some((phrase) =>
    text.includes(phrase)
  );
}

function detectReasoningMode(
  question: string,
  matches: KnowledgeMatch[]
): ReasoningMode {
  const text =
    question.toLowerCase().trim();

  const knowledgeIds = matches.map(
    ({ entry }) => entry.id
  );

  if (
    includesAny(text, [
      "difference between",
      "compare",
      "versus",
      "vs",
      "which is different",
    ])
  ) {
    return "comparison";
  }

  if (
    includesAny(text, [
      "why choose",
      "why would choose",
      "why take",
      "why would take",
      "why prefer",
      "why would prefer",
      "which market",
      "better market",
      "rather take",
      "prefer an alternate",
      "prefer the alternate",
    ])
  ) {
    return "market_choice";
  }

  if (
    includesAny(text, [
      "why does",
      "why is",
      "why are",
      "matter more",
      "more important",
      "how important",
    ])
  ) {
    return "factor_importance";
  }

  if (
    includesAny(text, [
      "how should",
      "how do i",
      "strategy",
      "approach",
      "manage",
      "when should",
    ])
  ) {
    return "strategy_explanation";
  }

  if (
    includesAny(text, [
      "what is",
      "what does",
      "meaning of",
      "define",
    ]) &&
    knowledgeIds.length <= 1
  ) {
    return "definition";
  }

  return "general_explanation";
}

function getModeInstructions(
  mode: ReasoningMode
): {
  title: string;
  instructions: string[];
} {
  switch (mode) {
    case "definition":
      return {
        title:
          "EasyRunLine Definition",
        instructions: [
          "Define the concept in clear language.",
          "Explain why it matters.",
          "Give one short supported example when available.",
          "Mention an important limitation or warning.",
        ],
      };

    case "comparison":
      return {
        title:
          "EasyRunLine Comparison",
        instructions: [
          "Explain each concept separately first.",
          "Identify the main difference between them.",
          "Explain when each concept or market is more relevant.",
          "Do not declare one universally better without supporting context.",
        ],
      };

    case "market_choice":
      return {
        title:
          "EasyRunLine Market Reasoning",
        instructions: [
          "Explain what each market measures or protects against.",
          "Identify the matchup factors that would favour each market.",
          "Explain the risk trade-off.",
          "Do not make a current recommendation without live engine data.",
        ],
      };

    case "factor_importance":
      return {
        title:
          "EasyRunLine Factor Analysis",
        instructions: [
          "Explain the factor clearly.",
          "Describe which part of the game it affects.",
          "Connect it to the relevant betting markets.",
          "Explain when the factor should receive less weight.",
        ],
      };

    case "strategy_explanation":
      return {
        title:
          "EasyRunLine Strategy Guide",
        instructions: [
          "Explain the strategy as a repeatable process.",
          "Separate preparation, decision and risk control.",
          "Avoid guarantees and profit promises.",
          "Include a discipline or verification reminder where relevant.",
        ],
      };

    default:
      return {
        title:
          "EasyRunLine Explanation",
        instructions: [
          "Answer the question directly.",
          "Use the retrieved knowledge as the main factual foundation.",
          "Connect related concepts only when they improve the explanation.",
          "State limitations clearly.",
        ],
      };
  }
}

function getModeSections(
  mode: ReasoningMode
): string[] {
  switch (mode) {
    case "definition":
      return [
        "Definition",
        "Why It Matters",
        "Example",
        "Important Limitation",
      ];

    case "comparison":
      return [
        "Concept One",
        "Concept Two",
        "Main Difference",
        "When Each Is Relevant",
        "Limitations",
      ];

    case "market_choice":
      return [
        "Market One",
        "Market Two",
        "Why One May Be Preferred",
        "Risk Trade-Off",
        "When the Other Market May Be Better",
        "Verification Reminder",
      ];

    case "factor_importance":
      return [
        "What the Factor Means",
        "How It Affects the Game",
        "Markets It Influences",
        "When It Matters Less",
        "Important Exceptions",
        "Summary",
      ];

    case "strategy_explanation":
      return [
        "Preparation",
        "Decision Process",
        "Risk Control",
        "Common Mistakes",
        "Summary",
      ];

    default:
      return [
        "Direct Answer",
        "Supporting Explanation",
        "Limitations",
      ];
  }
}

function getLanguageRules(): string[] {
  return [
    "Use conditional wording such as may, can, could, tends to, or depends on the evidence.",
    "Do not imply that a live EasyRunLine engine has evaluated the current matchup unless engine data was supplied.",
    "Do not claim that EasyRunLine found value, an edge, confidence, a score, or a verdict without supplied engine output.",
    "Do not describe a general strategy as universally better.",
    "Separate general principles from current-game conclusions.",
    "Do not invent exceptions that contradict the market settlement period.",
    "For F5 baseball markets, later innings and extra innings do not affect settlement.",
    "A bullpen may affect an F5 market only when the starting pitcher leaves before five innings.",
    "Never call a selection guaranteed, certain, risk-free, or a lock.",
    "Do not describe a season-long statistic as though it is divided by a betting settlement period.",
"For F5 analysis, explain that full-season pitching statistics provide context but do not isolate first-five performance.",
"When available, F5-specific form, early-inning splits and current starting-pitcher data are more directly relevant than full-game averages.",
  ];
}

export function buildReasoningPlan(
  question: string,
  matches: KnowledgeMatch[]
): ReasoningPlan {
  const mode =
    detectReasoningMode(
      question,
      matches
    );

  const modeDetails =
    getModeInstructions(mode);

  return {
  mode,
  title: modeDetails.title,
  instructions:
    modeDetails.instructions,
  sections:
    getModeSections(mode),
  languageRules:
    getLanguageRules(),
  knowledgeIds: matches.map(
    ({ entry }) => entry.id
  ),
};
}

export function formatReasoningPlan(
  plan: ReasoningPlan
) {
  return `
Reasoning Mode: ${plan.mode}
Response Title: ${plan.title}

Reasoning Instructions:
${plan.instructions
  .map(
    (instruction) =>
      `- ${instruction}`
  )
  .join("\n")}

Required Response Sections:
${plan.sections
  .map(
    (section, index) =>
      `${index + 1}. ${section}`
  )
  .join("\n")}
  Evidence and Language Rules:
${plan.languageRules
  .map(
    (rule) => `- ${rule}`
  )
  .join("\n")}


Knowledge Entries Available:
${
  plan.knowledgeIds.length > 0
    ? plan.knowledgeIds
        .map((id) => `- ${id}`)
        .join("\n")
    : "- No structured knowledge entry matched."
}
`.trim();
}