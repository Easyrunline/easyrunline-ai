"use client";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
type AssistantMode =
  | "research"
  | "live";
const quickQuestions = [
  "What does +4.5 mean?",
  "How does F5 +2.5 work?",
  "Explain blowout risk",
  "PLAY vs STRONG PLAY",
];
const learnCategories = [
  {
    id: "learn-baseball",
    label: "🎓 Learn Baseball",
    questions: [
      "What is WHIP?",
      "What is ERA?",
      "What is FIP?",
      "What is xFIP?",
    ],
  },
  {
    id: "betting-markets",
    label: "📊 Betting Markets",
    questions: [
      "What is a moneyline?",
      "What is a point spread?",
      "What is an alternate spread?",
      "What is implied probability?",
    ],
  },
  {
    id: "pitching-stats",
    label: "⚾ Pitching Stats",
    questions: [
      "What is WHIP?",
      "What is ERA?",
      "Why does bullpen fatigue matter?",
      "Why does F5 focus more on starting pitchers?",
    ],
  },
  {
    id: "basketball-analytics",
    label: "🏀 Basketball Analytics",
    questions: [
      "What is pace in basketball?",
      "What is net rating?",
      "Why does offensive efficiency matter?",
      "What is the difference between a full-game total and a first-half total?",
    ],
  },
  {
    id: "hockey-terms",
    label: "🏒 Hockey Terms",
    questions: [
      "What is goalie save percentage?",
      "What is Corsi?",
      "What are expected goals in hockey?",
      "Why do empty-net goals matter for puck lines?",
    ],
  },
  {
    id: "nfl-analytics",
    label: "🏈 NFL Analytics",
    questions: [
      "What is EPA per play?",
      "Why does pressure rate matter for a quarterback?",
      "What is the difference between an NFL spread and an alternate spread?",
      "Why does offensive-line protection matter?",
    ],
  },
  {
    id: "soccer-betting",
    label: "⚽ Soccer Betting",
    questions: [
      "What is expected goals in soccer?",
      "What is the difference between double chance and draw no bet?",
      "What is an Asian handicap?",
      "Why does fixture congestion affect pressing intensity?",
    ],
  },
];

const liveSports = [
  {
    id: "live-mlb",
    label: "⚾ MLB",
    questions: [
      "What is the safest MLB selection today?",
      "Which MLB games have the strongest moneyline support today?",
      "Which games qualify for protected alternate run lines today?",
      "Which MLB games have the safest F5 opportunities today?",
    ],
  },
  {
    id: "live-nba",
    label: "🏀 NBA",
    questions: [
      "What is the safest NBA selection today?",
      "Which NBA games have the strongest alternate-spread support today?",
      "Which NBA games have the safest totals today?",
      "Which NBA games should EasyRunLine avoid today?",
    ],
  },
  {
    id: "live-wnba",
    label: "🏀 WNBA",
    questions: [
      "What is the safest WNBA selection today?",
      "Which WNBA game has the safest alternate spread today?",
      "What is the safest WNBA first-half total today?",
      "What is the safest WNBA first-quarter total today?",
    ],
  },
  {
    id: "live-nfl",
    label: "🏈 NFL",
    questions: [
      "What is the safest NFL selection today?",
      "Which NFL games have the strongest alternate-spread support?",
      "Which quarterback matchups create the greatest risk?",
      "Which NFL games should EasyRunLine avoid?",
    ],
  },
  {
    id: "live-nhl",
    label: "🏒 NHL",
    questions: [
      "What is the safest NHL selection today?",
      "Which NHL game has the safest protected puck line?",
      "Which goalie matchups provide the strongest support?",
      "Which NHL games have the greatest blowout risk?",
    ],
  },
  {
    id: "live-soccer",
    label: "⚽ Soccer",
    questions: [
      "What is the safest soccer selection today?",
      "Which soccer games have the strongest protected-total support?",
      "Which matches qualify for an alternate handicap?",
      "Which soccer matches should EasyRunLine avoid today?",
    ],
  },
];
const loadingMessages = [
  "Loading EasyRunLine Intelligence...",
  "Searching Knowledge Base...",
  "Running Reasoning Engine...",
  "Cross-checking Markets...",
  "Preparing Answer...",
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

    const questionRef =
  useRef<HTMLTextAreaElement | null>(
    null
  );


const [
  assistantMode,
  setAssistantMode,
] = useState<AssistantMode>(
  "research"
);

const [
  tickerIndex,
  setTickerIndex,
] = useState(0);

const [
  tickerPaused,
  setTickerPaused,
] = useState(false);
const [
  activeLearnCategory,
  setActiveLearnCategory,
] = useState<
  (typeof learnCategories)[number] | null
>(null);

const [
  activeLiveSport,
  setActiveLiveSport,
] = useState<
  (typeof liveSports)[number] | null
>(null);
const [
  loadingMessageIndex,
  setLoadingMessageIndex,
] = useState(0);
const rotationStopped =
  useRef(false);

useEffect(() => {
  if (tickerPaused) {
    return;
  }

  const interval =
    window.setInterval(() => {
      setTickerIndex(
        (currentIndex) =>
          (currentIndex + 1) %
          quickQuestions.length
      );
    }, 6500);

  return () => {
    window.clearInterval(
      interval
    );
  };
}, [tickerPaused]);
useEffect(() => {
  if (!loading) {
    setLoadingMessageIndex(0);
    return;
  }

  const interval =
    window.setInterval(() => {
      setLoadingMessageIndex(
        (currentIndex) =>
          Math.min(
            currentIndex + 1,
            loadingMessages.length - 1
          )
      );
    }, 1400);

  return () => {
    window.clearInterval(interval);
  };
}, [loading]);

function changeAssistantMode(
  mode: AssistantMode
) {
  setAssistantMode(mode);
  setError("");
  setAnswer("");
  setQuestion("");
  setTickerPaused(false);

  if (mode === "research") {
    setActiveLiveSport(null);
  } else {
    setActiveLearnCategory(null);
  }

  window.setTimeout(() => {
    questionRef.current?.focus();
  }, 50);
}
  async function askEasyRunLine(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const finalQuestion =
      question.trim();

    if (
  !finalQuestion ||
  loading
) {
  return;
}

if (assistantMode === "live") {
  setError(
    "Live Analysis is coming soon. Switch to Learn & Research for general sports and betting questions."
  );

  return;
}

    try {
      setLoadingMessageIndex(0);
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

setQuestion("");


window.setTimeout(() => {
  questionRef.current?.focus();

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
              <div className="min-h-16 flex-1">
  <label
    htmlFor="general-ai-question"
    className="sr-only"
  >
    Ask EasyRunLine AI
  </label>

  <textarea
    ref={questionRef}
    id="general-ai-question"
    value={question}
    onChange={(event) => {
      rotationStopped.current =
        true;

      setQuestion(
        event.target.value
      );
    }}
    rows={2}
    maxLength={1000}
    placeholder={
      assistantMode === "research"
        ? "Ask EasyRunLine AI a sports, betting or market question..."
        : "Ask about today’s games, odds or matchups..."
    }
    className="min-h-16 w-full resize-none bg-transparent px-4 py-3 text-base text-white outline-none placeholder:text-zinc-600"
  />
</div>



              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
  <div
    className="flex min-h-11 items-center rounded-xl border border-zinc-800 bg-zinc-950 p-1"
    aria-label="EasyRunLine AI mode"
  >
    <button
      type="button"
      onClick={() =>
        changeAssistantMode(
          "research"
        )
      }
      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
        assistantMode ===
        "research"
          ? "bg-yellow-400 text-black"
          : "text-zinc-500 hover:text-white"
      }`}
      aria-pressed={
        assistantMode ===
        "research"
      }
    >
      📚 Learn
    </button>

    <button
      type="button"
      onClick={() =>
        changeAssistantMode(
          "live"
        )
      }
      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
        assistantMode ===
        "live"
          ? "bg-emerald-400 text-black"
          : "text-zinc-500 hover:text-white"
      }`}
      aria-pressed={
        assistantMode ===
        "live"
      }
    >
     ⚡ Live
    </button>
  </div>

  <button
    type="submit"
    disabled={
      loading ||
      !question.trim() ||
      assistantMode === "live"
    }
    className="min-h-14 rounded-xl bg-yellow-400 px-7 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
  >
    {assistantMode === "live"
  ? "Analyze →"
  : loading
    ? "Working..."
    : "Ask AI →"}
  </button>
</div>
            </div>
          </div>

          <p className="mt-3 text-center text-xs leading-5 text-zinc-600">
  {assistantMode === "research"
    ? "Learn & Research provides sports education, market explanations and EasyRunLine guidance."
    : "Live Analysis will use current data and fixed EasyRunLine engines when the connection is completed."}
</p>
{loading && assistantMode === "research" && (
  <div className="mx-auto mt-5 max-w-4xl rounded-2xl border border-yellow-500/25 bg-black px-5 py-4 shadow-[0_15px_50px_rgba(0,0,0,0.35)]">
    <div className="flex items-center gap-4">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-400/40 bg-yellow-400/10">
        <div className="h-3 w-3 animate-pulse rounded-full bg-yellow-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
          EasyRunLine AI Working
        </p>

        <p
          key={loadingMessageIndex}
          className="mt-1 animate-[erl-loading-message_350ms_ease-out] text-sm font-semibold text-zinc-300"
        >
          {
            loadingMessages[
              loadingMessageIndex
            ]
          }
        </p>
      </div>

      <div className="flex items-center gap-1">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400"
            style={{
              animationDelay:
                `${dot * 180}ms`,
            }}
          />
        ))}
      </div>
    </div>

    <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-900">
      <div
        className="h-full rounded-full bg-yellow-400 transition-all duration-500"
        style={{
          width: `${
            ((loadingMessageIndex + 1) /
              loadingMessages.length) *
            100
          }%`,
        }}
      />
    </div>
  </div>
)}
        </form>
        <div className="mx-auto mt-7 max-w-4xl overflow-hidden">
  <div
    className={`flex w-max items-center gap-3 whitespace-nowrap animate-[erl-prompt-row_55s_linear_infinite] ${
      tickerPaused
        ? "[animation-play-state:paused]"
        : ""
    }`}
  >
    {[
  ...(
    assistantMode === "research"
      ? learnCategories
      : liveSports
  ),
  ...(
    assistantMode === "research"
      ? learnCategories
      : liveSports
  ),
].map(
      (
        category,
        index
      ) => (
        <button
          key={`${category.id}-${index}`}
          type="button"
          onClick={() => {
  rotationStopped.current =
    true;

  setTickerPaused(true);
  setError("");

  if (
    assistantMode === "research"
  ) {
    setActiveLearnCategory(
      category as
        (typeof learnCategories)[number]
    );

    setActiveLiveSport(null);
  } else {
    setActiveLiveSport(
      category as
        (typeof liveSports)[number]
    );

    setActiveLearnCategory(null);
  }
}}
          className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:border-yellow-500/60 hover:bg-yellow-400/10 hover:text-yellow-400"
        >
          {category.label}
        </button>
      )
    )}
  </div>
</div>

        {activeLearnCategory && (
  <div className="mx-auto mt-5 max-w-4xl rounded-2xl border border-yellow-500/25 bg-black p-5">
    <div className="flex items-center justify-between gap-4 border-b border-zinc-900 pb-4">
      <div>
        <p className="text-sm font-black text-yellow-400">
          {
            activeLearnCategory.label
          }
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          Choose a question to place it in the Ask AI box.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setActiveLearnCategory(
            null
          );
        }}
        className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-500 transition hover:border-yellow-500/50 hover:text-yellow-400"
      >
        Close
      </button>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {activeLearnCategory.questions.map(
        (
          categoryQuestion
        ) => (
          <button
            key={categoryQuestion}
            type="button"
            onClick={() => {
              setQuestion(
                categoryQuestion
              );

              setError("");

              window.setTimeout(
                () => {
                  questionRef.current?.focus();
                },
                50
              );
            }}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-yellow-500/50 hover:bg-yellow-400/5 hover:text-yellow-400"
          >
            {categoryQuestion}
          </button>
        )
      )}
    </div>
  </div>
)}
{activeLiveSport && (
  <div className="mx-auto mt-5 max-w-4xl rounded-2xl border border-emerald-500/25 bg-black p-5">
    <div className="flex items-center justify-between gap-4 border-b border-zinc-900 pb-4">
      <div>
        <p className="text-sm font-black text-emerald-400">
          {activeLiveSport.label}
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          Choose a Live Analysis question.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setActiveLiveSport(null);
        }}
        className="rounded-lg border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-500 transition hover:border-emerald-500/50 hover:text-emerald-400"
      >
        Close
      </button>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {activeLiveSport.questions.map(
        (liveQuestion) => (
          <button
            key={liveQuestion}
            type="button"
            onClick={() => {
              setQuestion(
                liveQuestion
              );

              setError("");

              window.setTimeout(
                () => {
                  questionRef.current?.focus();
                },
                50
              );
            }}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-emerald-500/50 hover:bg-emerald-400/5 hover:text-emerald-400"
          >
            {liveQuestion}
          </button>
        )
      )}
    </div>
  </div>
)}

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