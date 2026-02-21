import Link from "next/link";
import { Sprout } from "lucide-react";
import { auth } from "@/auth";
import { SignInButton } from "@/components/auth/sign-in-button";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Sprout className="size-6 text-primary" />
          <span className="text-lg">Seeds</span>
        </Link>

        <nav className="ml-8 hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/seeds/new"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Plant a Seed
          </Link>
          {session && (
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              My Seeds
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {session ? <UserMenu /> : <SignInButton />}
          <MobileNav isLoggedIn={!!session} />
        </div>
      </div>
    </header>
  );
}
