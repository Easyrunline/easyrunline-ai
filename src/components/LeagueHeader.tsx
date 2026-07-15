type LeagueHeaderProps = {
  title: string;
  subtitle: string;
};

export default function LeagueHeader({
  title,
  subtitle,
}: LeagueHeaderProps) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400">
        {subtitle}
      </p>

      <h1 className="mt-2 text-4xl font-bold text-white">
        {title}
      </h1>
    </div>
  );
}