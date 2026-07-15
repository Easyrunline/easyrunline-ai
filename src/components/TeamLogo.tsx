type TeamLogoProps = {
  team: string;
  logoUrl: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export default function TeamLogo({
  team,
  logoUrl,
  size = "md",
}: TeamLogoProps) {
  if (!logoUrl) {
    return (
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300`}
        title={team}
      >
        {team
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 3)
          .toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${team} logo`}
      className={`${sizeClasses[size]} object-contain`}
      loading="lazy"
    />
  );
}