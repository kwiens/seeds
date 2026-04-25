"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { setBannerConfig } from "@/lib/actions/admin";
import type { BannerConfig } from "@/lib/db/queries/settings";

export function BannerSettings({ initial }: { initial: BannerConfig }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [message, setMessage] = useState(initial.message);
  const [href, setHref] = useState(initial.href);
  const [isPending, startTransition] = useTransition();

  const dirty =
    enabled !== initial.enabled ||
    message !== initial.message ||
    href !== initial.href;

  function save() {
    startTransition(async () => {
      const result = await setBannerConfig({ enabled, message, href });
      if (result.success) toast.success("Banner updated");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={enabled ? "default" : "outline"}
          size="sm"
          onClick={() => setEnabled(true)}
        >
          Enabled
        </Button>
        <Button
          type="button"
          variant={!enabled ? "default" : "outline"}
          size="sm"
          onClick={() => setEnabled(false)}
        >
          Disabled
        </Button>
        <span className="text-muted-foreground text-sm">
          {enabled ? "Banner is live" : "Banner is hidden"}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-message">Message</Label>
        <Textarea
          id="banner-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="TONIGHT: Join us for the Seed Pitch Night"
          rows={2}
          maxLength={200}
        />
        <p className="text-muted-foreground text-xs">
          Shown across the top of the site. Keep it short (up to 200 chars).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="banner-href">Link URL (optional)</Label>
        <Input
          id="banner-href"
          type="url"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="https://example.com/event"
        />
        <p className="text-muted-foreground text-xs">
          If set, the banner becomes a link opening in a new tab.
        </p>
      </div>

      <Button onClick={save} disabled={!dirty || isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
