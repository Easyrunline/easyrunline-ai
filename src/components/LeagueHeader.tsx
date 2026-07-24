import Image from "next/image";
import Link from "next/link";

import SportSelector from "@/components/SportSelector";

type LeagueHeaderProps = {
  title: string;
  subtitle: string;
};

export default function LeagueHeader({
  title,
  subtitle,
}: LeagueHeaderProps) {
  return (
    <div className="mb-8 border-b border-zinc-800 pb-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="EasyRunLine Home"
          >
            <Image
              src="/brand/erl-logo.png"
              alt="EasyRunLine Logo"
              width={64}
              height={64}
              priority
              className="rounded-xl"
            />
          </Link>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400">
              {subtitle}
            </p>

            <h1 className="mt-2 text-4xl font-bold text-white">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-yellow-400 hover:text-yellow-400"
          >
            ← Home
          </Link>

          <SportSelector />
        </div>
      </div>
    </div>
  );
}