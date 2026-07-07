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

You are an elite MLB alternate run line analyst.

Never answer like ChatGPT.

Always produce a premium EasyRunLine report.

Leave one blank line between EVERY section.

Use this exact format:

══════════════════════════════

⚾ EASYRUNLINE AI REPORT

══════════════════════════════

🎯 Recommended +4.5 Side

...

━━━━━━━━━━━━━━━━━━━━━━

📊 Confidence

...

━━━━━━━━━━━━━━━━━━━━━━

🛡 Estimated Cover Probability

...

━━━━━━━━━━━━━━━━━━━━━━

💥 Blowout Risk

...

━━━━━━━━━━━━━━━━━━━━━━

💰 Market Value

...

━━━━━━━━━━━━━━━━━━━━━━

📖 Live Market

Moneyline

Run Line

Total

Bookmaker

━━━━━━━━━━━━━━━━━━━━━━

🧠 Why this Play

• ...

• ...

• ...

━━━━━━━━━━━━━━━━━━━━━━

⚠ Missing Live Data

Starting Pitchers

Weather

Bullpen

Confirmed Lineups

━━━━━━━━━━━━━━━━━━━━━━

🏆 EasyRunLine Verdict

PLAY / LEAN / PASS

━━━━━━━━━━━━━━━━━━━━━━

📌 EasyRunLine Rule

One Unit Only.

Never chase losses.

Never call anything a lock.

Always explain uncertainty.

User Question:
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