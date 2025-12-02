# Design Backup - December 2, 2025

This file contains the original design code before the modern redesign.
Use this to revert if you prefer the original design.

---

## 1. globals.css (ORIGINAL)

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

---

## 2. page.tsx (ORIGINAL)

```tsx
import Link from 'next/link';
import { LiveTrending } from '@/components/LiveTrending';
import { NutritionDashboard } from '@/components/NutritionDashboard';
import { LiveStats } from '@/components/LiveStats';
import { MealPeriodIndicator } from '@/components/MealPeriodIndicator';
import { QuickMealBuilder } from '@/components/QuickMealBuilder';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to{' '}
            <span className="text-emerald-600 dark:text-emerald-400">Campus Eats</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Discover delicious dining options across campus. Browse menus, check nutrition info, and find meals that fit your lifestyle.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              AI-Powered
            </span>
            <span>•</span>
            <span>Click the 🤖 button to chat with our AI assistant</span>
          </div>
        </div>

        {/* Live Stats Bar */}
        <LiveStats />
        
        {/* Meal Period Indicator */}
        <div className="mb-8">
          <MealPeriodIndicator />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Link href="/venues" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-emerald-500">
              <div className="text-5xl mb-4">🏢</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Dining Venues
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Explore all campus dining locations and their hours
              </p>
            </div>
          </Link>

          <Link href="/dishes" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-500">
              <div className="text-5xl mb-4">🍕</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                Browse Menu
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Check out what&apos;s cooking with nutrition details
              </p>
            </div>
          </Link>

          <Link href="/recommendations" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500">
              <div className="text-5xl mb-4">✨</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                For You
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Personalized recommendations based on your taste
              </p>
            </div>
          </Link>
        </div>

        {/* Live Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <LiveTrending />
          <NutritionDashboard />
        </div>
        
        {/* Meal Planner */}
        <div className="mb-12">
          <QuickMealBuilder />
        </div>

        {/* Features */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-8 md:p-12 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">Why Campus Eats?</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="font-semibold mb-1">AI Assistant</h3>
              <p className="text-emerald-100 text-sm">Chat to find your perfect meal</p>
            </div>
            <div>
              <div className="text-4xl mb-2">📊</div>
              <h3 className="font-semibold mb-1">Nutrition Tracking</h3>
              <p className="text-emerald-100 text-sm">Track your daily intake</p>
            </div>
            <div>
              <div className="text-4xl mb-2">🔥</div>
              <h3 className="font-semibold mb-1">Live Trending</h3>
              <p className="text-emerald-100 text-sm">See what&apos;s popular now</p>
            </div>
            <div>
              <div className="text-4xl mb-2">🎤</div>
              <h3 className="font-semibold mb-1">Voice Search</h3>
              <p className="text-emerald-100 text-sm">Hands-free meal discovery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Header.tsx (ORIGINAL)

```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🍽️</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                Campus Eats
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/venues" 
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Venues
            </Link>
            <Link 
              href="/dishes" 
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Menu
            </Link>
            <Link 
              href="/recommendations" 
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              For You
            </Link>
            <Link 
              href="/favorites" 
              className="text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
              title="Favorites"
            >
              ❤️
            </Link>
            <Link 
              href="/reviews" 
              className="text-gray-600 dark:text-gray-300 hover:text-yellow-500 transition-colors"
              title="My Reviews"
            >
              ⭐
            </Link>
            <Link 
              href="/login" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-emerald-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link 
              href="/venues" 
              className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Venues
            </Link>
            <Link 
              href="/dishes" 
              className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              Menu
            </Link>
            <Link 
              href="/recommendations" 
              className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              onClick={() => setIsMenuOpen(false)}
            >
              For You
            </Link>
            <Link 
              href="/login" 
              className="block px-4 py-2 bg-emerald-600 text-white rounded-lg text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
```

---

## 4. layout.tsx (ORIGINAL)

```tsx
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
  title: "Campus Eats - Find Your Next Meal",
  description: "Discover and review campus dining options at GSU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900`}
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
```

---

## HOW TO REVERT

To revert to the original design, simply copy the code blocks above and replace the respective files:
1. `/apps/web/app/globals.css`
2. `/apps/web/app/page.tsx`
3. `/apps/web/components/Header.tsx`
4. `/apps/web/app/layout.tsx`
