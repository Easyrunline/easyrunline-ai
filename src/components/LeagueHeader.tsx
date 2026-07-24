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
    <header className="bg-black">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          aria-label="EasyRunLine Home"
          className="flex items-center gap-3"
        >
          <Image
            src="/brand/erl-logo.png"
            alt="EasyRunLine Logo"
            width={44}
            height={44}
            priority
            className="rounded-lg"
          />

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-400">
              {title}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {subtitle}
            </p>
          </div>
        </Link>

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
    </header>
  );
}