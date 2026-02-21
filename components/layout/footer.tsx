import { Sprout } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Sprout className="size-4 text-primary" />
          <span className="font-medium text-foreground">Seeds</span>
        </div>
        <p>Growing Chattanooga, one seed at a time.</p>
        <p className="text-xs">Chattanooga National Park City</p>
      </div>
    </footer>
  );
}
