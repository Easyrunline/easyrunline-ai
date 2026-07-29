const wnbaTeamAbbreviations: Record<string, string> = {
  "Atlanta Dream": "atl",
  "Chicago Sky": "chi",
  "Connecticut Sun": "con",
  "Dallas Wings": "dal",
  "Golden State Valkyries": "gs",
  "Indiana Fever": "ind",
  "Las Vegas Aces": "lv",
  "Los Angeles Sparks": "la",
  "Minnesota Lynx": "min",
  "New York Liberty": "ny",
  "Phoenix Mercury": "phx",
  "Seattle Storm": "sea",
  "Toronto Tempo": "tor",
  "Washington Mystics": "wsh",
};

export function getWNBALogoUrl(teamName: string) {
  const abbreviation =
    wnbaTeamAbbreviations[teamName];

  if (!abbreviation) {
    return null;
  }

  return `https://a.espncdn.com/i/teamlogos/wnba/500/${abbreviation}.png`;
}