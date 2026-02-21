import Link from "next/link";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SeedNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Sprout className="size-16 text-muted-foreground" />
      <h2 className="text-2xl font-bold">Seed Not Found</h2>
      <p className="text-muted-foreground max-w-md">
        This seed may not exist yet, or it hasn&apos;t been approved.
      </p>
      <Button asChild>
        <Link href="/">Back to Explore</Link>
      </Button>
    </div>
  );
}
