"use client";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
const quickQuestions = [
  "What does +4.5 mean?",
  "How does F5 +2.5 work?",
  "Explain blowout risk",
  "PLAY vs STRONG PLAY",
];

export default function GeneralAIBox() {
  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const answerRef =
    useRef<HTMLDivElement | null>(
      null
    );
const [
  activeQuickQuestion,
  setActiveQuickQuestion,
] = useState(0);

const rotationStopped =
  useRef(false);

useEffect(() => {
  let currentIndex = 0;

  setQuestion(
    quickQuestions[currentIndex]
  );

  const rotationInterval =
    window.setInterval(() => {
      if (
        rotationStopped.current
      ) {
        window.clearInterval(
          rotationInterval
        );

        return;
      }

      currentIndex += 1;

      if (
        currentIndex >=
        quickQuestions.length
      ) {
        window.clearInterval(
          rotationInterval
        );

        return;
      }

      setActiveQuickQuestion(
        currentIndex
      );

      setQuestion(
        quickQuestions[currentIndex]
      );
    }, 1800);

  return () => {
    window.clearInterval(
      rotationInterval
    );
  };
}, []);
  async function askEasyRunLine(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const finalQuestion =
      question.trim();

    if (!finalQuestion || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnswer("");

      const response = await fetch(
        "/api/general-analyze",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            question: finalQuestion,
          }),
        }
      );

      const data =
        (await response.json()) as {
          answer?: string;
        };

      if (!response.ok) {
        setError(
          data.answer ||
            "Could not answer your question."
        );

        return;
      }

      setAnswer(
        data.answer ||
          "No answer was returned."
      );

      window.setTimeout(() => {
        answerRef.current?.scrollIntoView(
          {
            behavior: "smooth",
            block: "nearest",
          }
        );
      }, 100);
    } catch {
      setError(
        "Could not connect to EasyRunLine AI. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="ask-ai"
      className="relative border-b border-zinc-900 bg-zinc-950/40"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(234,179,8,0.09),_transparent_48%)]"
      />

      <div className="relative mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-400/50 bg-yellow-400/10 font-black text-yellow-400 shadow-[0_0_35px_rgba(234,179,8,0.12)]">
            AI
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
            EasyRunLine AI Guide
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Ask. Learn. Enter informed.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Ask general questions about
            markets, betting terminology,
            EasyRunLine ratings and how to
            use each sport workspace.
          </p>
        </div>

        <form
          onSubmit={askEasyRunLine}
          className="mx-auto mt-10 max-w-4xl"
        >
          <div className="rounded-2xl border border-yellow-500/40 bg-black p-2 shadow-[0_20px_80px_rgba(0,0,0,0.45)] transition focus-within:border-yellow-400">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label
                htmlFor="general-ai-question"
                className="sr-only"
              >
                Ask EasyRunLine AI
              </label>

              <textarea
                id="general-ai-question"
                value={question}
                onChange={(event) => {
  rotationStopped.current = true;

  setQuestion(
    event.target.value
  );
}}
                rows={2}
                maxLength={1000}
                placeholder="Ask EasyRunLine AI a general sports or market question..."
                className="min-h-16 flex-1 resize-none bg-transparent px-4 py-3 text-base text-white outline-none placeholder:text-zinc-600"
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !question.trim()
                }
                className="min-h-14 rounded-xl bg-yellow-400 px-7 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {loading
                  ? "Thinking..."
                  : "Ask AI →"}
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-xs leading-5 text-zinc-600">
            General guidance only. Open a
            sport workspace for live games,
            fixed-engine scores and current
            recommendations.
          </p>
        </form>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {quickQuestions.map(
  (
    quickQuestion,
    index
  ) => (
              <button
                key={quickQuestion}
                type="button"
                onClick={() => {
  rotationStopped.current = true;

  setActiveQuickQuestion(
    index
  );

  setQuestion(
    quickQuestion
  );
}}
className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
  activeQuickQuestion === index
    ? "border-yellow-500/70 bg-yellow-400/10 text-yellow-400"
    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-yellow-500/50 hover:text-yellow-400"
}`}
              >
                {quickQuestion}
              </button>
            )
          )}
        </div>

        {error && (
          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {answer && (
          <div
            ref={answerRef}
            className="mx-auto mt-8 max-w-4xl rounded-3xl border border-yellow-500/25 bg-black p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-center justify-between gap-4 border-b border-zinc-900 pb-5">
  <div className="flex items-center gap-3">
    <div className="h-11 w-11 shrink-0">
  <Image
    src="/brand/erl-logo-transparent.png"
    alt="EasyRunLine logo"
    width={44}
    height={44}
    className="h-full w-full object-contain"
  />
</div>

    <div>
      <p className="font-black">
        EasyRunLine AI
      </p>

      <p className="text-xs text-zinc-600">
        General Sports Guide
      </p>
    </div>
  </div>

  <button
    type="button"
    onClick={() => {
      setAnswer("");
      setError("");
    }}
    className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-500 transition hover:border-yellow-500/50 hover:text-yellow-400"
    aria-label="Clear EasyRunLine AI answer"
  >
    Clear
  </button>
</div>

            <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-300 sm:text-base">
              {answer}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}