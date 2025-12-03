import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { AIChatAssistant } from "@/components/AIChatAssistant";
import SmartNotifications from "@/components/SmartNotifications";
import LocationMenuDetector from "@/components/LocationMenuDetector";
import { ToastProvider } from "@/components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Campus Eats - Your Ultimate Campus Dining Guide",
  description: "Discover, explore and review campus dining options at GSU. AI-powered recommendations, nutrition tracking, and real-time menus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#fafafa] dark:bg-[#09090b] text-gray-900 dark:text-gray-100`}
      >
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <AIChatAssistant />
        <SmartNotifications />
        <LocationMenuDetector />
        <ToastProvider />
      </body>
    </html>
  );
}
