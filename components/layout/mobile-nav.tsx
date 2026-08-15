"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav({
  isLoggedIn,
  unreadSproutCount,
}: {
  isLoggedIn: boolean;
  unreadSproutCount: number;
}) {
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
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2 px-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground py-2 text-sm transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/about"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground py-2 text-sm transition-colors"
          >
            About
          </Link>
          <Link
            href="/faq"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground py-2 text-sm transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/seeds/new"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground py-2 text-sm transition-colors"
          >
            Plant a Seed
          </Link>
          {isLoggedIn && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 py-2 text-sm transition-colors"
            >
              My Projects
              {unreadSproutCount > 0 && (
                <span className="bg-primary text-primary-foreground inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                  {unreadSproutCount}
                  <span className="sr-only">unread</span>
                </span>
              )}
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
