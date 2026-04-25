import { ExternalLink } from "lucide-react";
import { getBannerConfig } from "@/lib/db/queries/settings";

export async function EventBanner() {
  const config = await getBannerConfig();

  if (!config.enabled || !config.message) return null;

  const content = (
    <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-sm font-medium">
      <span>{config.message}</span>
      {config.href && <ExternalLink className="h-3.5 w-3.5 shrink-0" />}
    </div>
  );

  if (config.href) {
    return (
      <a
        href={config.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {content}
      </a>
    );
  }

  return <div className="bg-primary text-primary-foreground">{content}</div>;
}
