import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nightingale-care-note.l2498185124.chatgpt.site"),
  title: "Nightingale Care Note",
  description: "A trusted longitudinal care note with glanceable actions, role-safe collaboration, and source-linked AI summaries.",
  openGraph: {
    title: "Nightingale Care Note",
    description: "Trusted context. Clear next steps.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Nightingale Care Note" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nightingale Care Note",
    description: "Trusted context. Clear next steps.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-SG">
      <body className="antialiased">{children}</body>
    </html>
  );
}
