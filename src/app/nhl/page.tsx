import NHLGameCard from "@/components/nhl/NHLGameCard";

const placeholderGames = [
  {
    awayTeam: "Toronto Maple Leafs",
    homeTeam: "Boston Bruins",
  },
  {
    awayTeam: "New York Rangers",
    homeTeam: "New Jersey Devils",
  },
];

export default function NHLPage() {
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
            NHL puck-line intelligence, goalie analysis and alternate-line
            recommendations are currently under development.
          </p>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          {placeholderGames.map((game) => (
            <NHLGameCard
              key={`${game.awayTeam}-${game.homeTeam}`}
              awayTeam={game.awayTeam}
              homeTeam={game.homeTeam}
            />
          ))}
        </section>
      </div>
    </main>
  );
}