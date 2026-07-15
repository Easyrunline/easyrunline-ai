import TeamLogo from "./TeamLogo";

type GameCardProps = {
  league: string;

  homeTeam: string;
  awayTeam: string;

  homeLogo: string | null;
  awayLogo: string | null;

  commenceTime: string;

  children: React.ReactNode;
};

export default function GameCard({
  league,
  homeTeam,
  awayTeam,
  homeLogo,
  awayLogo,
  commenceTime,
  children,
}: GameCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
          {league} Matchup
        </p>

        <p className="text-xs text-zinc-500">
          {new Date(commenceTime).toLocaleString()}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TeamLogo
            team={awayTeam}
            logoUrl={awayLogo}
            size="md"
          />

          <span className="font-semibold">
            {awayTeam}
          </span>
        </div>

        <span className="text-zinc-500 font-bold">
          @
        </span>

        <div className="flex items-center gap-3">
          <span className="font-semibold">
            {homeTeam}
          </span>

          <TeamLogo
            team={homeTeam}
            logoUrl={homeLogo}
            size="md"
          />
        </div>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}