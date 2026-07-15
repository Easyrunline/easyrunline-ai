type MarketCardProps = {
  title: string;
  children: React.ReactNode;
};

export default function MarketCard({
  title,
  children,
}: MarketCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
        {title}
      </p>

      <div className="mt-3 space-y-2 text-sm text-zinc-300">
        {children}
      </div>
    </div>
  );
}