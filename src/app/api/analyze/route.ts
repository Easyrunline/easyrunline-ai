import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    const response = await client.responses.create({
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
- selected teams,
- avoided teams,
- or engine reasons,

reproduce those details exactly as supplied.

Do not perform a separate prediction that contradicts the engine.
Do not change selected teams.
Do not turn avoided teams into recommended plays.
Do not upgrade or downgrade supplied confidence or blowout-risk labels.

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
    console.error(error);

    return Response.json(
      { answer: "Something went wrong while analyzing. Please try again." },
      { status: 500 }
    );
  }
}