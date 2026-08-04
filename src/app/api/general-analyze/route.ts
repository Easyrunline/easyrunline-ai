import OpenAI from "openai";

import {
  routeSportsQuestion,
} from "@/lib/ai/sportsRouter";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GeneralAnalyzeRequest {
  question?: string;
}
function requiresLiveEngine(
  intent: string
) {
  return [
    "best_bet",
    "compare_games",
    "games_to_avoid",
    "schedule",
    "standings",
    "injury_update",
  ].includes(intent);
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        GeneralAnalyzeRequest;

    const question =
      body.question?.trim();

    if (!question) {
      return Response.json(
        {
          answer:
            "Please enter a sports or EasyRunLine question.",
        },
        {
          status: 400,
        }
      );
    }

    const route =
      routeSportsQuestion(question);

    console.log(
  "Homepage EasyRunLine route:",
  route
);

if (requiresLiveEngine(route.intent)) {
  const sportName =
    route.sport === "general"
      ? "relevant sport"
      : route.sport.toUpperCase();

  return Response.json({
    answer:
      `I identified this as a ${sportName} request that requires current data or a fixed EasyRunLine engine result.\n\n` +
      `The homepage assistant has not yet loaded the live ${sportName} engine context, so I will not invent a team, market, price, ERL Score, confidence rating or verdict.\n\n` +
      `Please open the ${sportName} workspace for the current analysis while this homepage connection is being developed.`,
    routing: route,
    requiresLiveData: true,
  });
}

const response =
  await client.responses.create({
        model: "gpt-4.1-mini",

        input: `
You are the EasyRunLine AI Guide.

Your role is to answer broad questions about:
- EasyRunLine
- baseball and MLB
- basketball, NBA and WNBA
- American football and NFL
- hockey and NHL
- soccer
- sports rules
- sports terminology
- player and team statistics
- sports betting terminology
- alternate run lines and spreads
- MLB First 5 Innings markets
- moneylines
- totals
- parlays
- market verification
- engine confidence
- blowout risk
- responsible bankroll management
- navigating the EasyRunLine sport workspaces

Write in clear, professional and understandable language.

Important rules:

Do not define PLAY, STRONG PLAY, LEAN or any other EasyRunLine verdict as positive expected value, profitable value, a market edge or guaranteed betting value.

EasyRunLine verdicts describe the strength of supplied engine evidence and the risk profile. They do not prove that a wager has positive expected value.

When explaining EasyRunLine verdicts:
- STRONG PLAY means the fixed engine found exceptionally strong supporting evidence with acceptable risk.
- PLAY means the fixed engine found sufficient supporting evidence with acceptable risk.
- LEAN means some supporting evidence exists, but conviction is limited.
- PASS means the identified risks or insufficient evidence prevent a recommendation.

Do not use Markdown emphasis symbols such as ** around words.
Use clean plain text because the homepage answer panel displays plain text.

Never invent:
- current games
- current scores
- live odds
- sportsbook prices
- injuries
- starting lineups
- starting pitchers
- current team statistics
- EasyRunLine scores
- EasyRunLine confidence ratings
- EasyRunLine verdicts
- current recommendations
- unsupported probabilities
- unavailable markets or prices

The homepage AI Guide does not currently receive live sport data or fixed scoring-engine results.

If the user asks for:
- today's best pick
- a current matchup recommendation
- a live EasyRunLine score
- the safest current selection
- current odds
- current parlays
- current games to avoid
- live injuries
- today's fixtures or scores

do not invent an answer.

Explain that the sport and request were identified correctly, but live engine context has not yet been loaded into the homepage assistant.

Direct the user to the relevant MLB, NFL, NBA, WNBA, NHL or Soccer workspace for current fixed-engine analysis.

Do not claim that any selection is:
- guaranteed
- certain
- a lock
- risk-free

Never promise profit or encourage chasing losses.

Keep ordinary answers concise, but provide enough explanation for a beginner to understand.

When useful, use short bullet points.

End betting-related explanations with a brief reminder that users should verify the exact market and price in their sportsbook.

Detected request:

Sport: ${route.sport}
Intent: ${route.intent}
Routing confidence: ${route.confidence}

Use the detected sport and intent only as organisational guidance.

For general knowledge, terminology, rules, strategy, platform help and educational questions:
answer the question directly.

For requests requiring current fixtures, current odds, live injuries, current team statistics, current recommendations or a fixed EasyRunLine engine result:
do not invent live data, a team selection, ERL Score, confidence label or verdict.

User question:
${question}
`,
      });

    return Response.json({
      answer: response.output_text,
      routing: route,
    });
  } catch (error) {
    console.error(
      "General Analyze API error:",
      error
    );

    return Response.json(
      {
        answer:
          "Something went wrong while answering your question. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}