export type NFLAlternateSpreadOutcome = {
  name: string;
  price: number;
  point: number;
};

export type NFLAlternateSpreadBookmaker = {
  key: string;
  title: string;
  lastUpdate: string | null;
  outcomes: NFLAlternateSpreadOutcome[];
};

export type NFLAlternateSpreadSelection = {
  team: string;
  point: number;
  price: number;
  bookmaker: string;
};

export function formatNFLSpread(point: number) {
  return point > 0 ? `+${point}` : `${point}`;
}

export function findSafestAvailableSpread(
  teamName: string,
  bookmakers: NFLAlternateSpreadBookmaker[]
): NFLAlternateSpreadSelection | null {
  const availableSelections = bookmakers.flatMap(
    (bookmaker) =>
      bookmaker.outcomes
        .filter(
          (outcome) =>
            outcome.name === teamName &&
            Number.isFinite(outcome.point) &&
            Number.isFinite(outcome.price)
        )
        .map((outcome) => ({
          team: outcome.name,
          point: outcome.point,
          price: outcome.price,
          bookmaker: bookmaker.title,
        }))
  );

  if (availableSelections.length === 0) {
    return null;
  }

  availableSelections.sort((a, b) => {
    // A higher spread is safer:
    // +4.5 is safer than +3.5
    // -3.5 is safer than -4.5
    if (b.point !== a.point) {
      return b.point - a.point;
    }

    // If the spread is identical, prefer the better price.
    return b.price - a.price;
  });

  return availableSelections[0];
}