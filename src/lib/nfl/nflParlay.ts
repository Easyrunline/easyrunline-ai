import type {
  NFLAlternateSpreadLeg,
  NFLAlternateSpreadParlay,
} from "./nflAlternateSpread";

export function buildNFLAlternateSpreadParlay(
  legs: NFLAlternateSpreadLeg[],
  requiredLegs: number
): NFLAlternateSpreadParlay | null {
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

  const uniqueLegs: NFLAlternateSpreadLeg[] = [];
  const usedEventIds = new Set<string>();
  const usedTeams = new Set<string>();

  for (const leg of rankedLegs) {
    if (usedEventIds.has(leg.eventId)) {
      continue;
    }

    if (usedTeams.has(leg.team)) {
      continue;
    }

    /*
     * Reject model lines with no positive cushion.
     * A positive cushion means the projected result
     * remains inside the selected handicap.
     */
    if (leg.modelCushion <= 0) {
      continue;
    }

    /*
     * Early safety floor. We can calibrate this after
     * historical NFL testing.
     */
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