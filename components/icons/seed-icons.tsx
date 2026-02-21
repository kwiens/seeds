import Image from "next/image";

export type SeedIconName =
  | "idea"
  | "gardeners"
  | "soil"
  | "roots"
  | "water"
  | "support"
  | "sunlight"
  | "harvest";

const iconPaths: Record<SeedIconName, string> = {
  idea: "/icons/idea.svg",
  gardeners: "/icons/gardeners.svg",
  soil: "/icons/soil.svg",
  roots: "/icons/roots.svg",
  water: "/icons/water.svg",
  support: "/icons/support.svg",
  sunlight: "/icons/sunlight.svg",
  harvest: "/icons/harvest.svg",
};

const iconLabels: Record<SeedIconName, string> = {
  idea: "Idea",
  gardeners: "Gardeners",
  soil: "Soil",
  roots: "Roots",
  water: "Water",
  support: "Support",
  sunlight: "Sunlight",
  harvest: "Harvest",
};

export function SeedIcon({
  name,
  size = 32,
  className,
}: {
  name: SeedIconName;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={iconPaths[name]}
      alt={iconLabels[name]}
      width={size}
      height={size}
      className={className}
    />
  );
}
