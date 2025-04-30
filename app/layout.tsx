import type React from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata = {
  title: {
    default: "StoryVibe - Immersive Reading with Chapter Music",
    template: "%s | StoryVibe",
  },
  description:
    "A modern storytelling platform where writers can publish stories with music to enhance the reading experience.",
  keywords: [
    "storytelling",
    "music",
    "reading",
    "writing",
    "stories",
    "chapters",
    "immersive reading",
  ],
  openGraph: {
    title: "StoryVibe - Immersive Reading with Chapter Music",
    description:
      "A modern storytelling platform where writers can publish stories with music to enhance the reading experience.",
    url: "https://storyvibe.example.com",
    siteName: "StoryVibe",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="canonical" href="https://storyvibe.example.com" />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-[#111111]">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
