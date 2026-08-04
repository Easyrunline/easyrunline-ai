import OpenAI from "openai";



import { analyzeGame } from "@/lib/nhl/analyzeGame";
import type {
  NHLGameAnalysis,
} from "@/lib/nhl/types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalyzeRequest {
  question?: string;
  sport?: string;
  game?: NHLGameAnalysis;
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as AnalyzeRequest;

    /* ===========================================================
       NHL FIXED SCORING ENGINE
       =========================================================== */

    if (
      body.sport?.toLowerCase() === "nhl" &&
      body.game
    ) {
      const recommendation =
        analyzeGame(body.game);

      return Response.json(
        recommendation
      );
    }

    /* ===========================================================
       EASYRUNLINE AI REPORT
       =========================================================== */

    if (!body.question?.trim()) {
  return Response.json(
    {
      answer:
        "A question or NHL game analysis is required.",
    },
    { status: 400 }
  );
}

const question = body.question.trim();

const response =
  await client.responses.create({
        model: "gpt-4.1-mini",

        input: `
You are EasyRunLine AI.

Produce a professional EasyRunLine report.

Follow every instruction in the supplied request exactly.

The EasyRunLine fixed scoring engine is the authoritative source of truth.

When the request supplies:
- an ERL Score,
- Engine Confidence,
- Blowout Risk,
- an Engine Verdict,
- a Verdict Reason,
- selected teams,
- avoided teams,
- or engine reasons,

reproduce those details exactly as supplied.

Do not perform a separate prediction that contradicts the engine.
Do not change selected teams.
Do not turn avoided teams into recommended plays.
Do not upgrade or downgrade supplied confidence or blowout-risk labels.

When an Engine Verdict is supplied, reproduce it exactly.
The supplied Engine Verdict is deterministic and authoritative.
Never replace STRONG PLAY with PLAY, LEAN, or PASS.
Never replace PLAY with LEAN or PASS.
Never create a separate verdict based on missing alternate-line pricing.

Missing exact +4.5 pricing does not change the matchup verdict.
It only means the user must verify that their sportsbook offers the recommended +4.5 line at an acceptable price.
If the sportsbook does not offer that line, the wagering action is PASS.

Never invent:
- cover probabilities,
- unsupported percentages,
- alternate-line availability,
- alternate-line prices,
- expected value,
- positive EV,
- profitable value,
- or missing data that was actually supplied.

EasyRunLine +4.5 selections are underdog targets only.
Never recommend the favorite +4.5.

Follow the report structure, headings, wording rules, and market warnings contained in the supplied request.

Supplied request:
${question}
`,
      });

   return Response.json({
  answer: response.output_text,
});
  } catch (error) {
    console.error(
      "Analyze API error:",
      error
    );

    return Response.json(
      {
        answer:
          "Something went wrong while analyzing. Please try again.",
      },
      { status: 500 }
    );
  }
}