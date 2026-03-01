import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground">
        <Image
          src="/logo-horizontal.svg"
          alt="National Park City Seeds"
          width={220}
          height={70}
        />
        <p>Growing our region, one seed at a time.</p>
        <p className="text-xs">Chattanooga National Park City</p>
      </div>
    </footer>
  );
}
