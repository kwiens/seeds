import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground">
        <Image
          src="/wild-chattanooga-logo.png"
          alt="Wild Chattanooga"
          width={100}
          height={40}
          className="h-auto"
        />
        <p>We&apos;re growing the best place in the world to live.</p>
        <p className="text-brand-moss text-xs font-bold tracking-wide uppercase">
          Let&apos;s Grow.
        </p>
      </div>
    </footer>
  );
}
