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

  const uniqueLegs: NFLAlternateSpreadLeg[] = [];
  const usedEventIds = new Set<string>();

  for (const leg of legs) {
    if (usedEventIds.has(leg.eventId)) {
      continue;
    }

    if (
      !Number.isFinite(leg.price) ||
      leg.price <= 1 ||
      !Number.isFinite(leg.point)
    ) {
      continue;
    }

    usedEventIds.add(leg.eventId);
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