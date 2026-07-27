import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GeneralAnalyzeRequest {
  question?: string;
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

    const response =
      await client.responses.create({
        model: "gpt-4.1-mini",

        input: `
You are the EasyRunLine AI Guide.

Your role is to answer general questions about:
- EasyRunLine
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

Do not invent:
Do not define PLAY, STRONG PLAY, LEAN or any other EasyRunLine verdict as positive expected value, profitable value, a market edge or guaranteed betting value.

EasyRunLine verdicts describe the strength of the supplied engine evidence and risk profile. They do not prove that a wager has positive expected value.

When explaining EasyRunLine verdicts:
- STRONG PLAY means the fixed engine found exceptionally strong supporting evidence with acceptable risk.
- PLAY means the fixed engine found sufficient supporting evidence with acceptable risk.
- LEAN means some supporting evidence exists, but conviction is limited.
- PASS means the identified risks or insufficient evidence prevent a recommendation.

Do not use Markdown emphasis symbols such as ** around words. Use clean plain text because the homepage answer panel displays plain text.
- current games
- current scores
- live odds
- sportsbook prices
- injuries
- starting lineups
- starting pitchers
- team statistics
- EasyRunLine scores
- EasyRunLine confidence ratings
- EasyRunLine verdicts
- current recommendations

The homepage AI Guide does not receive live sport data.

If the user asks for:
- today's best pick
- a current matchup recommendation
- a live EasyRunLine score
- the safest current selection
- current odds
- current parlays
- current games to avoid

explain that they should open the relevant MLB, NFL, NBA, NHL or Soccer workspace so its live data and fixed scoring engine can evaluate the request.

Do not claim that any selection is:
- guaranteed
- certain
- a lock
- risk-free

Never promise profit or encourage chasing losses.

Keep ordinary answers concise, but provide enough explanation for a beginner to understand.

When useful, use short bullet points.

End betting-related explanations with a brief reminder that users should verify the exact market and price in their sportsbook.

User question:
${question}
`,
      });

    return Response.json({
      answer: response.output_text,
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