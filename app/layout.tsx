import type { Metadata } from "next";
import Script from "next/script";
import { Archivo } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.npcseeds.org"),
  title: "National Park City Seeds",
  description:
    "Grow the best place in the world to live. Community-led projects across Chattanooga.",
  openGraph: {
    title: "National Park City Seeds",
    description:
      "Grow the best place in the world to live. Community-led projects across Chattanooga.",
    images: [
      {
        url: "/npc_landscape_chattanooga.jpg",
        width: 1000,
        height: 522,
        alt: "Chattanooga National Park City landscape",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "National Park City Seeds",
    description:
      "Grow the best place in the world to live. Community-led projects across Chattanooga.",
    images: ["/npc_landscape_chattanooga.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-X3QH16E5QV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-X3QH16E5QV');
          `}
        </Script>
      </head>
      <body className={`${archivo.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-svh flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
