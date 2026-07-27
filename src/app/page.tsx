import Image from "next/image";
import Link from "next/link";
import GeneralAIBox from "@/components/GeneralAIBox";
const sports = [
  {
    name: "MLB",
    icon: "⚾",
    engine:
      "Run-Line Intelligence",
    description:
      "Pitcher analysis, bullpen form, recent +4.5 performance, H2H intelligence and alternate-market protection.",
    href: "/mlb",
    accent:
      "border-blue-500/30 hover:border-blue-400",
    brand:
      "border-blue-500/30 bg-gradient-to-br from-blue-500/20 via-blue-950/10 to-black",
    brandText:
      "text-blue-300",
    glow:
      "group-hover:shadow-[0_20px_60px_rgba(59,130,246,0.12)]",
  },
  {
    name: "NFL",
    icon: "🏈",
    engine:
      "Spread Intelligence",
    description:
      "Quarterback intelligence, team form, spread analysis and alternate-line protection.",
    href: "/nfl",
    accent:
      "border-orange-500/30 hover:border-orange-400",
    brand:
      "border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-orange-950/10 to-black",
    brandText:
      "text-orange-300",
    glow:
      "group-hover:shadow-[0_20px_60px_rgba(249,115,22,0.12)]",
  },
  {
    name: "NBA",
    icon: "🏀",
    engine:
      "Alternate-Spread Intelligence",
    description:
      "Spread intelligence, alternate markets and matchup-based basketball analysis.",
    href: "/nba",
    accent:
      "border-purple-500/30 hover:border-purple-400",
    brand:
      "border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-purple-950/10 to-black",
    brandText:
      "text-purple-300",
    glow:
      "group-hover:shadow-[0_20px_60px_rgba(168,85,247,0.12)]",
  },
  {
    name: "NHL",
    icon: "🏒",
    engine:
      "Puck-Line Intelligence",
    description:
      "Goalie intelligence, team form, injury context and safer puck-line analysis.",
    href: "/nhl",
    accent:
      "border-cyan-500/30 hover:border-cyan-400",
    brand:
      "border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 via-cyan-950/10 to-black",
    brandText:
      "text-cyan-300",
    glow:
      "group-hover:shadow-[0_20px_60px_rgba(6,182,212,0.12)]",
  },
  {
    name: "Soccer",
    icon: "⚽",
    engine:
      "Football Market Intelligence",
    description:
      "League-specific market intelligence, protected totals and handicap analysis.",
    href: "/soccer",
    accent:
      "border-emerald-500/30 hover:border-emerald-400",
    brand:
      "border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 via-emerald-950/10 to-black",
    brandText:
      "text-emerald-300",
    glow:
      "group-hover:shadow-[0_20px_60px_rgba(16,185,129,0.12)]",
  },
];

const principles = [
  {
    number: "01",
    title: "Verified Market Data",
    description:
      "Recommendations use markets that are actually available, including their displayed lines, prices and bookmakers.",
  },
  {
    number: "02",
    title: "Deterministic Intelligence",
    description:
      "EasyRunLine applies fixed scoring rules before AI explains the result. The AI does not replace the engine decision.",
  },
  {
    number: "03",
    title: "Risk-Aware Reporting",
    description:
      "Every report separates matchup quality, market protection, confidence and uncertainty.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <header className="border-b border-zinc-900 bg-black/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="EasyRunLine home"
          >
            <div className="h-12 w-12 shrink-0">
  <Image
    src="/brand/erl-logo-transparent.png"
    alt="EasyRunLine logo"
    width={48}
    height={48}
    priority
    className="h-full w-full object-contain"
  />
</div>

            <div>
              <p className="text-sm font-black tracking-[0.22em] text-yellow-400">
                EASYRUNLINE
              </p>
              <p className="text-xs text-zinc-500">
                Multi-Sport Intelligence
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-zinc-400 md:flex">
            <a href="#sports" className="transition hover:text-white">
              Sports
            </a>
            <a
  href="#ask-ai"
  className="transition hover:text-white"
>
  Ask AI
</a>
            <a href="#method" className="transition hover:text-white">
              How It Works
            </a>
            <a href="#principles" className="transition hover:text-white">
              Principles
            </a>
          </nav>

          <Link
            href="#sports"
            className="rounded-lg border border-yellow-400/60 px-4 py-2 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400 hover:text-black"
          >
            Open Platform
          </Link>
        </div>
      </header>

      <section className="relative border-b border-zinc-900">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(234,179,8,0.14),_transparent_45%)]"
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-yellow-400">
              Multi-Sport Market Intelligence
            </p>

            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Smarter analysis.
              <span className="block text-yellow-400">
                Clearer decisions.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-400">
              EasyRunLine combines verified sportsbook markets with
              deterministic sports intelligence to identify protected
              opportunities without hiding uncertainty.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/mlb"
                className="rounded-xl bg-yellow-400 px-7 py-4 text-center font-black text-black transition hover:bg-yellow-300"
              >
                Explore Live Intelligence
              </Link>

              <a
                href="#method"
                className="rounded-xl border border-zinc-700 bg-zinc-950 px-7 py-4 text-center font-bold text-white transition hover:border-zinc-500"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-500">
              <span>✓ Verified markets</span>
              <span>✓ Fixed scoring engines</span>
              <span>✓ Transparent uncertainty</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-8 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="relative rounded-3xl border border-yellow-500/30 bg-zinc-950/90 p-7 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">
                    EasyRunLine Intelligence
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    Market Protection View
                  </h2>
                </div>

                <div className="h-16 w-16 shrink-0">
  <Image
    src="/brand/erl-logo-transparent.png"
    alt="EasyRunLine intelligence logo"
    width={64}
    height={64}
    className="h-full w-full object-contain"
  />
</div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                      Market verification
                    </p>
                    <p className="text-sm font-bold text-emerald-400">
                      Connected
                    </p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900">
                    <div className="h-full w-[92%] rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                    <p className="text-xs uppercase tracking-wider text-zinc-500">
                      Engine
                    </p>
                    <p className="mt-2 font-bold">Deterministic</p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-black p-5">
                    <p className="text-xs uppercase tracking-wider text-zinc-500">
                      Coverage
                    </p>
                    <p className="mt-2 font-bold">Five Sports</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-yellow-500/30 bg-yellow-400/5 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                    EasyRunLine Standard
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    No locks. No invented prices. No forced selections.
                    Every decision must explain its uncertainty.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    <GeneralAIBox />

<section
  id="sports"
        
        className="mx-auto max-w-7xl px-6 py-20 lg:px-8"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
            Choose Your Sport
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            One platform. Five intelligence engines.
          </h2>

          <p className="mt-5 text-lg leading-8 text-zinc-400">
            Enter a sport-specific workspace to review live games,
            connected markets and EasyRunLine analysis.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
  {sports.map(
    (sport, index) => (
      <Link
        key={sport.name}
        href={sport.href}
        className={`group flex h-full flex-col rounded-3xl border bg-zinc-950 p-4 transition duration-300 hover:-translate-y-2 hover:bg-zinc-900 ${sport.accent} ${sport.glow}`}
      >
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 ${sport.brand}`}
        >
          <div
            aria-hidden="true"
            className="absolute -right-5 -top-6 text-8xl opacity-[0.08] transition duration-500 group-hover:rotate-12 group-hover:scale-110"
          >
            {sport.icon}
          </div>

          <div className="relative flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/60 text-3xl shadow-xl">
              {sport.icon}
            </div>

            <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Engine {index + 1}
            </span>
          </div>

          <div className="relative mt-8">
            <p
              className={`text-3xl font-black tracking-tight ${sport.brandText}`}
            >
              {sport.name}
            </p>

            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              EasyRunLine Intelligence
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-2 pb-2 pt-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-400">
            {sport.engine}
          </p>

          <p className="mt-4 flex-1 text-sm leading-6 text-zinc-500">
            {sport.description}
          </p>

          <div className="mt-7 flex items-center justify-between border-t border-zinc-900 pt-5">
            <span className="text-sm font-black text-white">
              Open workspace
            </span>

            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-400/5 text-yellow-400 transition duration-300 group-hover:translate-x-1 group-hover:bg-yellow-400 group-hover:text-black">
              →
            </span>
          </div>
        </div>
      </Link>
    )
  )}
</div>
      </section>

      <section
        id="method"
        className="border-y border-zinc-900 bg-zinc-950/50"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
              How It Works
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight">
              The engine decides first.
              <span className="block text-zinc-500">
                The explanation follows.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              EasyRunLine separates deterministic scoring from written
              analysis. Market data and sport-specific factors produce
              the engine result. AI then explains that result without
              changing its score, confidence or selection.
            </p>
          </div>

          <div className="space-y-4">
            {[
              ["1", "Connect", "Load current games and verified sportsbook markets."],
              ["2", "Evaluate", "Apply the fixed EasyRunLine scoring engine."],
              ["3", "Protect", "Check market availability, risk and confidence."],
              ["4", "Explain", "Present the decision in clear, responsible language."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="flex gap-5 rounded-2xl border border-zinc-800 bg-black p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400 font-black text-black">
                  {number}
                </div>

                <div>
                  <h3 className="font-black">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="principles"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-8"
      >
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-yellow-400">
            Built on Transparency
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight">
            Intelligence you can inspect.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {principles.map((principle) => (
            <div
              key={principle.number}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-7"
            >
              <p className="text-sm font-black text-yellow-400">
                {principle.number}
              </p>
              <h3 className="mt-5 text-xl font-black">
                {principle.title}
              </h3>
              <p className="mt-3 leading-7 text-zinc-500">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-yellow-500/30 bg-yellow-400 p-8 text-black sm:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em]">
                Development Access
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Explore EasyRunLine while we build.
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-black/70">
                Current sport intelligence remains openly available
                during development. Account access and subscription
                options will be introduced later.
              </p>
            </div>

            <Link
  href="#sports"
  className="shrink-0 rounded-xl bg-black px-7 py-4 text-center font-black text-white transition hover:bg-zinc-900"
>
  Choose Your Sport
</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© 2026 EasyRunLine. Multi-Sport Intelligence.</p>

          <p>
            Informational analysis only. Always verify markets and
            manage risk responsibly.
          </p>
        </div>
      </footer>
    </main>
  );
}