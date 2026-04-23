import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Async Agent Inbox for Next.js | Tencent RTC Chat SDK Demo",
  description:
    "Open-source async agent inbox for Next.js. Built for long-running AI tasks with real delivery, history, unread state, and Tencent RTC Chat SDK integration.",
  keywords: [
    "async agent inbox",
    "agent inbox",
    "Tencent RTC Chat SDK",
    "persistent chat",
    "AI inbox",
    "Next.js agent starter",
    "chat sdk",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
