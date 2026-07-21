import NHLTeamLogo from "@/components/nhl/NHLTeamLogo";

import type {
  NHLGameAnalysis,
  NHLGameRecommendation,
  ScoreBreakdown,
} from "@/lib/nhl/types";

type NHLGameCardProps = {
  awayTeam: string;
  homeTeam: string;

  analysis?: NHLGameAnalysis;

  recommendation?:
    NHLGameRecommendation;
};

export default function NHLGameCard({
  awayTeam,
  homeTeam,
  analysis,
  recommendation,
}: NHLGameCardProps) {
  const recommendedTeam =
    recommendation?.recommendedTeam;

  const comparison =
    recommendation?.comparison;

  return (
    <article className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-lg">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Team
          team={awayTeam}
          venue="Away"
        />

        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          VS
        </p>

        <Team
          team={homeTeam}
          venue="Home"
        />
      </div>

      <section className="mt-8">
        <SectionTitle>
          🥅 Projected Goalies
        </SectionTitle>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            title={`${awayTeam} Goalie`}
            value={
              analysis
                ? analysis.away.goalie
                    .goalieName
                : "--"
            }
            detail={
              analysis
                ? formatGoalie(
                    analysis.away
                      .goalie
                  )
                : undefined
            }
          />

          <Metric
            title={`${homeTeam} Goalie`}
            value={
              analysis
                ? analysis.home.goalie
                    .goalieName
                : "--"
            }
            detail={
              analysis
                ? formatGoalie(
                    analysis.home
                      .goalie
                  )
                : undefined
            }
          />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle>
          📈 Recent Form
        </SectionTitle>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            title={awayTeam}
            value={
              analysis
                ? analysis.away.form
                    .last10
                : "--"
            }
            detail={
              analysis
                ? formatForm(
                    analysis.away
                  )
                : undefined
            }
          />

          <Metric
            title={homeTeam}
            value={
              analysis
                ? analysis.home.form
                    .last10
                : "--"
            }
            detail={
              analysis
                ? formatForm(
                    analysis.home
                  )
                : undefined
            }
          />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle>
          ⚡ EasyRunLine Metrics
        </SectionTitle>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            title="ERL Score"
            value={
              recommendedTeam
                ? `${recommendedTeam.erlScore}/100`
                : "--"
            }
          />

          <Metric
            title="Confidence"
            value={
              recommendedTeam
                ?.confidence ?? "--"
            }
          />

          <Metric
  title={
    comparison &&
    recommendedTeam &&
    comparison.winner !==
      recommendedTeam.team
      ? "Opponent Edge"
      : "Target Edge"
  }
  value={
    comparison
      ? `${comparison.edge} — ${comparison.edgeRating}`
      : "--"
  }
/>
        </div>
      </section>

      {recommendedTeam && (
        <section className="mt-8">
          <SectionTitle>
            🧠 Engine Breakdown
          </SectionTitle>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(
              recommendedTeam.breakdown
            ).map((item) => (
              <BreakdownMetric
                key={item.title}
                item={item}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-yellow-300">
          Recommended +2.5 Target
        </p>

        <p className="mt-3 text-2xl font-bold text-yellow-400">
          {recommendedTeam
            ? `${recommendedTeam.team} +2.5`
            : "Analyzing..."}
        </p>

        {recommendedTeam && (
          <p className="mt-2 text-sm text-zinc-300">
            {
              recommendedTeam.recommendation
            }
            {" · "}
            {
              recommendedTeam.confidence
            }{" "}
            confidence
          </p>
        )}

        <p className="mt-3 text-xs leading-5 text-zinc-500">
          Verify the exact alternate
          +2.5 puck line and price in
          your betting app. If it is
          unavailable, pass.
        </p>
      </section>
    </article>
  );
}

function Team({
  team,
  venue,
}: {
  team: string;
  venue: "Home" | "Away";
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <NHLTeamLogo
        team={team}
        size={80}
      />

      <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">
        {team}
      </h2>

      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {venue}
      </p>
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-yellow-400">
      {children}
    </h3>
  );
}

function Metric({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl bg-black/40 p-4">
      <p className="text-sm text-zinc-400">
        {title}
      </p>

      <p className="mt-2 text-lg font-semibold text-white">
        {value}
      </p>

      {detail && (
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          {detail}
        </p>
      )}
    </div>
  );
}

function BreakdownMetric({
  item,
}: {
  item: ScoreBreakdown;
}) {
  const scoreColor =
    item.score > 0
      ? "text-green-400"
      : item.score < 0
        ? "text-red-400"
        : "text-zinc-400";

  return (
    <div className="rounded-xl bg-black/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">
          {item.title}
        </p>

        <p className={`font-bold ${scoreColor}`}>
          {item.score > 0
            ? `+${item.score}`
            : item.score}
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-zinc-500">
        {item.reason}
      </p>
    </div>
  );
}

function formatGoalie(
  goalie:
    NHLGameAnalysis["home"]["goalie"]
): string {
  return [
    `Projected`,
    `SV% ${goalie.savePct.toFixed(3)}`,
    `GAA ${goalie.gaa.toFixed(2)}`,
    `${goalie.starts} starts`,
  ].join(" · ");
}

function formatForm(
  team:
    NHLGameAnalysis["home"]
): string {
  return [
    team.form.momentum,
    `GF ${team.stats.goalsPerGame.toFixed(2)}`,
    `GA ${team.stats.goalsAgainstPerGame.toFixed(2)}`,
    `Streak ${team.form.streak}`,
  ].join(" · ");
}