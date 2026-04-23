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
  title: "Agent Chat UI | Next.js AI Agent Inbox with Tencent RTC Chat SDK",
  description:
    "Open-source AI agent chat UI for Next.js built with Tencent RTC Chat SDK. Mock mode, real chat history, bot relay, and a free-forever path to production.",
  keywords: [
    "agent chat ui",
    "ai chat ui",
    "Tencent RTC Chat SDK",
    "free chat api",
    "Next.js chat example",
    "AI inbox",
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
