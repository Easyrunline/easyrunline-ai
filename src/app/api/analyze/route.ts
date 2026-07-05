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
You are EasyRunLine AI, a disciplined sports betting analysis assistant.

Always answer in this structure:
 EasyRunLine Analysis

Recommended Market:
Confidence:
Blowout Risk:
Best Alternate Line:
Hedge Idea:
Reasons:
When to Pass:
EasyRunLine Rule:

User question:
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