type NHLGameCardProps = {
  awayTeam: string;
  homeTeam: string;
};

export default function NHLGameCard({
  awayTeam,
  homeTeam,
}: NHLGameCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-lg">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          NHL Matchup
        </p>

        <h2 className="mt-4 text-2xl font-bold text-white">
          {awayTeam}
        </h2>

        <p className="my-2 text-sm font-semibold uppercase text-zinc-500">
          vs
        </p>

        <h2 className="text-2xl font-bold text-white">
          {homeTeam}
        </h2>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-black/40 p-4">
          <p className="text-sm text-zinc-400">Goalie Edge</p>
          <p className="mt-1 text-lg font-semibold text-white">--</p>
        </div>

        <div className="rounded-xl bg-black/40 p-4">
          <p className="text-sm text-zinc-400">Recent Form</p>
          <p className="mt-1 text-lg font-semibold text-white">--</p>
        </div>

        <div className="rounded-xl bg-black/40 p-4">
          <p className="text-sm text-zinc-400">Home Ice</p>
          <p className="mt-1 text-lg font-semibold text-white">--</p>
        </div>

        <div className="rounded-xl bg-black/40 p-4">
          <p className="text-sm text-zinc-400">ERL Score</p>
          <p className="mt-1 text-lg font-semibold text-white">--</p>
        </div>

        <div className="rounded-xl bg-black/40 p-4">
          <p className="text-sm text-zinc-400">Confidence</p>
          <p className="mt-1 text-lg font-semibold text-white">--</p>
        </div>

        <div className="rounded-xl bg-black/40 p-4">
          <p className="text-sm text-zinc-400">Blowout Risk</p>
          <p className="mt-1 text-lg font-semibold text-white">--</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
        <p className="text-sm uppercase tracking-wide text-yellow-300">
          Recommendation
        </p>

        <p className="mt-2 text-xl font-bold text-yellow-400">
          Coming Soon
        </p>
      </div>
    </article>
  );
}