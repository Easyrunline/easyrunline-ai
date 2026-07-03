export default function Home() {
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
            className="h-32 w-full resize-none rounded-xl border border-zinc-800 bg-black p-4 text-white outline-none placeholder:text-zinc-500"
            placeholder="Ask EasyRunLine AI: Is Pittsburgh +4.5 a good bet tonight?"
          />

          <button className="mt-4 w-full rounded-xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300">
            Analyze
          </button>
        </div>

        <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="font-bold text-yellow-400">Alternate Lines</h3>
            <p className="mt-2 text-sm text-zinc-400">Compare safer markets.</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="font-bold text-yellow-400">Blowout Risk</h3>
            <p className="mt-2 text-sm text-zinc-400">Avoid dangerous spots.</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="font-bold text-yellow-400">Hedge Ideas</h3>
            <p className="mt-2 text-sm text-zinc-400">Protect the bankroll.</p>
          </div>
        </div>

        <p className="mt-10 text-sm text-zinc-500">
          Discipline. Value. Results. One Unit At A Time.
        </p>
      </section>
    </main>
  );
}