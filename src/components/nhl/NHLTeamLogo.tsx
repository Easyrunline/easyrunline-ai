import Image from "next/image";
import { NHL_TEAM_LOGOS } from "@/lib/nhl/teams";

type NHLTeamLogoProps = {
  team: string;
  size?: number;
};

export default function NHLTeamLogo({
  team,
  size = 64,
}: NHLTeamLogoProps) {
  const logo = NHL_TEAM_LOGOS[team];

  if (!logo) {
    return (
      <div
        style={{
          width: size,
          height: size,
        }}
        className="rounded-full bg-zinc-800"
      />
    );
  }

  return (
    <Image
      src={logo}
      alt={team}
      width={size}
      height={size}
      priority
    />
  );
}