"use client";

import { useEffect, useState } from "react";

import NHLGameCard from "@/components/nhl/NHLGameCard";

import type {
  NormalizedNHLOddsGame,
} from "@/lib/nhl/odds";

type NHLOddsResponse = {
  games?: NormalizedNHLOddsGame[];
  error?: string;
};

export default function NHLPage() {
  const [games, setGames] =
    useState<NormalizedNHLOddsGame[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      try {
        const response =
          await fetch("/api/nhl-odds");

        const data =
          (await response.json()) as NHLOddsResponse;

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Unable to load NHL games."
          );
        }

        setGames(data.games ?? []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load NHL games."
        );
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            🏒 EASYRUNLINE AI
          </h1>

          <p className="mt-3 text-lg text-zinc-400">
            National Hockey League
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-500">
            NHL puck-line intelligence, goalie analysis,
            team form and market-based recommendations.
          </p>
        </div>

        {loading && (
          <p className="mt-10 text-center text-zinc-400">
            Loading NHL games...
          </p>
        )}

        {error && (
          <p className="mt-10 text-center text-red-400">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          games.length === 0 && (
            <p className="mt-10 text-center text-zinc-400">
              No upcoming NHL games are currently
              available.
            </p>
          )}

        {!loading &&
          !error &&
          games.length > 0 && (
            <section className="mt-10 grid gap-6 lg:grid-cols-2">
              {games.map((game) => (
                <NHLGameCard
                  key={game.id}
                  awayTeam={game.awayTeam}
                  homeTeam={game.homeTeam}
                />
              ))}
            </section>
          )}
      </div>
    </main>
  );
}