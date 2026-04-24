import { ExternalLink } from "lucide-react";

export function EventBanner() {
  return (
    <a
      href="https://www.studioourscha.com/event-details/national-park-city-seed-pitch-night"
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium">
        <span>
          <span className="font-semibold">TONIGHT:</span> Join us for the
          National Park City Seed Pitch Night
        </span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </div>
    </a>
  );
}
