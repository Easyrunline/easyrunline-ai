import type {
  NBAAlternateSpreadLeg,
  NBAAlternateSpreadParlay,
} from "./nbaAlternateSpread";

export function buildNBAAlternateSpreadParlay(
  legs: NBAAlternateSpreadLeg[],
  requiredLegs: number
): NBAAlternateSpreadParlay | null {
  if (legs.length < requiredLegs) {
    return null;
  }

  const rankedLegs = [...legs]
    .filter(
      (leg) =>
        Number.isFinite(leg.price) &&
        leg.price > 1 &&
        Number.isFinite(leg.point) &&
        Number.isFinite(leg.safetyScore) &&
        Number.isFinite(leg.modelCushion)
    )
    .sort((a, b) => {
      if (b.safetyScore !== a.safetyScore) {
        return b.safetyScore - a.safetyScore;
      }

      if (b.modelCushion !== a.modelCushion) {
        return b.modelCushion - a.modelCushion;
      }

      if (b.erlScore !== a.erlScore) {
        return b.erlScore - a.erlScore;
      }

      return b.price - a.price;
    });

  const uniqueLegs: NBAAlternateSpreadLeg[] = [];
  const usedEventIds = new Set<string>();
  const usedTeams = new Set<string>();

  for (const leg of rankedLegs) {
    if (usedEventIds.has(leg.eventId)) {
      continue;
    }

    if (usedTeams.has(leg.team)) {
      continue;
    }

    if (leg.modelCushion <= 0) {
      continue;
    }

    if (leg.safetyScore < 60) {
      continue;
    }

    usedEventIds.add(leg.eventId);
    usedTeams.add(leg.team);
    uniqueLegs.push(leg);

    if (uniqueLegs.length === requiredLegs) {
      break;
    }
  }

  if (uniqueLegs.length < requiredLegs) {
    return null;
  }

  const combinedPrice = uniqueLegs.reduce(
    (total, leg) => total * leg.price,
    1
  );

  return {
    legs: uniqueLegs,
    combinedPrice: Number(combinedPrice.toFixed(2)),
  };
}