"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="National Park City Seeds"
              width={120}
              height={39}
            />
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            About
          </Link>
          <Link
            href="/seeds/new"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Plant a Seed
          </Link>
          {isLoggedIn && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              My Seeds
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
