import NHLTeamLogo from "@/components/nhl/NHLTeamLogo";
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

      {/* Teams */}

<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
  <div className="flex flex-col items-center text-center">
    <NHLTeamLogo team={awayTeam} size={80} />

    <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">
      {awayTeam}
    </h2>

    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
      Away
    </p>
  </div>

  <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
    VS
  </p>

  <div className="flex flex-col items-center text-center">
    <NHLTeamLogo team={homeTeam} size={80} />

    <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">
      {homeTeam}
    </h2>

    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
      Home
    </p>
  </div>
</div>

      {/* Goalies */}

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-yellow-400">
          🏒 Goalies
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric title="Starting Goalie" />
          <Metric title="Backup Goalie" />
        </div>
      </section>

      {/* Team Analysis */}

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-yellow-400">
          📈 Team Analysis
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric title="Recent Form" />
          <Metric title="Home Ice" />
          <Metric title="Rest Days" />
        </div>
      </section>

      {/* ERL */}

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-yellow-400">
          ⚡ EasyRunLine Metrics
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric title="ERL Score" />
          <Metric title="Confidence" />
          <Metric title="Blowout Risk" />
        </div>
      </section>

      {/* Recommendation */}

      <section className="mt-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-yellow-300">
          Recommendation
        </p>

        <p className="mt-3 text-2xl font-bold text-yellow-400">
          Coming Soon
        </p>
      </section>

    </article>
  );
}

function Metric({ title }: { title: string }) {
  return (
    <div className="rounded-xl bg-black/40 p-4">
      <p className="text-sm text-zinc-400">{title}</p>

      <p className="mt-2 text-lg font-semibold text-white">
        --
      </p>
    </div>
  );
}