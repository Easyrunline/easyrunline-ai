"use client";

import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeQuestion() {
    setLoading(true);
    setAnswer("");

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    const data = await response.json();

    setAnswer(data.answer);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-yellow-400">
          EasyRunLine AI
        </p>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
          Smarter sports betting analysis.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
          Ask questions about run lines, alternate handicaps, blowout risk,
          confidence levels, and hedge ideas across major sports.
        </p>

        <div className="mt-10 w-full max-w-2xl rounded-2xl border border-yellow-500/30 bg-zinc-950 p-4 shadow-2xl">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="h-32 w-full resize-none rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none placeholder:text-zinc-500"
            placeholder="Ask EasyRunLine AI: Is White Sox +4.5 a good bet tonight?"
          />

          <button
            onClick={analyzeQuestion}
            disabled={loading || !question}
            className="mt-4 w-full rounded-xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {answer && (
          <div className="mt-8 w-full max-w-2xl whitespace-pre-line rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-left text-zinc-200">
            {answer}
          </div>
        )}

        <p className="mt-10 text-sm text-zinc-500">
          Discipline. Value. Results. One Unit At A Time.
        </p>
      </section>
    </main>
  );
}