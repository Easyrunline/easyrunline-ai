"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

const sports = [
  {
  name: "MLB",
  icon: "⚾",
  path: "/mlb",
},
  {
    name: "NFL",
    icon: "🏈",
    path: "/nfl",
  },
  {
    name: "NBA",
    icon: "🏀",
    path: "/nba",
  },
  {
    name: "NHL",
    icon: "🏒",
    path: "/nhl",
  },
  {
    name: "Soccer",
    icon: "⚽",
    path: "/soccer",
  },
];

export default function SportSelector() {
  const router = useRouter();
  const pathname = usePathname();

  const selectedSport =
    sports.find(
      (sport) =>
        pathname === sport.path ||
        pathname.startsWith(`${sport.path}/`)
    )?.path ?? "/mlb";

  function handleSportChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    router.push(event.target.value);
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Select sport</span>

      <select
        value={selectedSport}
        onChange={handleSportChange}
        className="cursor-pointer appearance-none rounded-lg border border-yellow-500/60 bg-black px-4 py-2 pr-10 text-sm font-semibold text-white outline-none transition hover:border-yellow-400 focus:border-yellow-400"
      >
        {sports.map((sport) => (
          <option
            key={sport.path}
            value={sport.path}
            className="bg-black text-white"
          >
            {sport.icon} {sport.name}
          </option>
        ))}
      </select>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 text-yellow-400"
      >
        ▾
      </span>
    </label>
  );
}