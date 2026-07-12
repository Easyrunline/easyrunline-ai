const competitions = [
  "MLS",
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Champions League",
  "Europa League",
];

export default function SoccerPage() {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <h1 className="text-3xl font-bold text-yellow-400">
        EasyRunLine Soccer
      </h1>

      <p className="mt-4 text-gray-300">
        Select a competition to access soccer game intelligence and analysis.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {competitions.map((competition) => (
          <div
            key={competition}
            className="rounded-xl border border-gray-800 bg-gray-950 p-5"
          >
            <h2 className="font-semibold">{competition}</h2>
            <p className="mt-2 text-sm text-gray-400">
              Engine under development
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}