import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { SignInButton } from "@/components/auth/sign-in-button";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getMyProjects } from "@/lib/db/queries/my-projects";

export async function Header() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  // Admins always have access and don't need an unread badge, so avoid the
  // platform-wide query. Council members do use it for cross-Sprout unread
  // counts because their site-wide access is part of their working view.
  const sprouts =
    session?.user?.id && !isAdmin
      ? await getMyProjects(session.user.id, session.user.role)
      : [];
  const unreadSproutCount = sprouts.filter((s) => s.unreadCount > 0).length;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Image
            src="/logo.svg"
            alt="National Park City Seeds"
            width={137}
            height={44}
            priority
          />
        </Link>

        <nav className="ml-8 hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/about"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            About
          </Link>
          <Link
            href="/faq"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            FAQ
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
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
            >
              Mine
              {unreadSproutCount > 0 && (
                <span className="bg-primary text-primary-foreground inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
                  {unreadSproutCount}
                </span>
              )}
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {session ? <UserMenu /> : <SignInButton />}
          <MobileNav
            isLoggedIn={!!session}
            unreadSproutCount={unreadSproutCount}
          />
        </div>
      </div>
    </header>
  );
}
