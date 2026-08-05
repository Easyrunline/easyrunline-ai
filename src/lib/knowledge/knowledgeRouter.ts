import {
  BETTING_KNOWLEDGE,
  type KnowledgeEntry,
} from "./bettingKnowledge";
import {
  BASEBALL_KNOWLEDGE,
} from "./baseballKnowledge";
import {
  BASKETBALL_KNOWLEDGE,
} from "./basketballKnowledge";
import {
  HOCKEY_KNOWLEDGE,
} from "./hockeyKnowledge";
import {
  FOOTBALL_KNOWLEDGE,
} from "./footballKnowledge";

const ALL_KNOWLEDGE: KnowledgeEntry[] = [
  ...BETTING_KNOWLEDGE,
  ...BASEBALL_KNOWLEDGE,
  ...BASKETBALL_KNOWLEDGE,
  ...HOCKEY_KNOWLEDGE,
  ...FOOTBALL_KNOWLEDGE,
];
  
export type KnowledgeMatch = {
  entry: KnowledgeEntry;
  score: number;
  matchedTerms: string[];
};
function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[-–—]/g, " ")
    .replace(/[^\w\s+./]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchTerms(
  entry: KnowledgeEntry
) {
  return Array.from(
    new Set(
      [
        entry.title,
        ...entry.aliases,
      ]
        .map(normalizeText)
        .filter(Boolean)
    )
  );
}
function questionMatchesTerm(
  question: string,
  term: string
) {
  if (!term) {
    return false;
  }

  if (term.includes(" ")) {
    return question.includes(term);
  }

  const questionTokens =
    question.split(" ");

  return questionTokens.includes(term);
}

function scoreEntry(
  question: string,
  entry: KnowledgeEntry
): KnowledgeMatch {
  const normalizedQuestion =
    normalizeText(question);

  const matchedTerms =
  getSearchTerms(entry).filter(
    (term) =>
      questionMatchesTerm(
        normalizedQuestion,
        term
      )
  );
  let score = 0;

  for (const term of matchedTerms) {
    const wordCount =
      term.split(" ").length;

    score += wordCount * 10;

    if (
      normalizedQuestion === term
    ) {
      score += 20;
    }

    if (
      normalizeText(entry.title) === term
    ) {
      score += 8;
    }
  }

  return {
    entry,
    score,
    matchedTerms,
  };
}

export function findBettingKnowledge(
  question: string,
  limit = 3
): KnowledgeMatch[] {
  if (!question.trim()) {
    return [];
  }

  return ALL_KNOWLEDGE
  .map((entry) =>
    scoreEntry(question, entry)
  )
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function formatKnowledgeContext(
  matches: KnowledgeMatch[]
) {
  if (matches.length === 0) {
    return "";
  }

  return matches
    .map(({ entry }, index) => {
      const warnings =
        entry.warnings?.length
          ? entry.warnings
              .map(
                (warning) =>
                  `- ${warning}`
              )
              .join("\n")
          : "None supplied.";

      return `
Knowledge Entry ${index + 1}

Title: ${entry.title}
Category: ${entry.category}
Summary: ${entry.summary}
Explanation: ${entry.explanation}
Example: ${
        entry.example ??
        "No example supplied."
      }
Warnings:
${warnings}
`.trim();
    })
    .join("\n\n");
}