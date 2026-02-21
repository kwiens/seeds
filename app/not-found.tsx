import Link from "next/link";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Sprout className="size-16 text-muted-foreground" />
      <h2 className="text-2xl font-bold">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md">
        This seed hasn&apos;t been planted yet. Head back to explore what&apos;s
        growing.
      </p>
      <Button asChild>
        <Link href="/">Explore Seeds</Link>
      </Button>
    </div>
  );
}
