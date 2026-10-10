import Image from "next/image";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground">
        <Image
          src={siteConfig.brand.logoHorizontal.src}
          alt={siteConfig.name}
          width={siteConfig.brand.logoHorizontal.width}
          height={siteConfig.brand.logoHorizontal.height}
          className="h-auto"
        />
        <p>{siteConfig.tagline}</p>
        <p className="text-xs">{siteConfig.city.organization}</p>
      </div>
    </footer>
  );
}
