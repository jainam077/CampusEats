import Link from 'next/link';
import { LiveTrending } from '@/components/LiveTrending';
import { NutritionDashboard } from '@/components/NutritionDashboard';
import { LiveStats } from '@/components/LiveStats';
import { MealPeriodIndicator } from '@/components/MealPeriodIndicator';
import { QuickMealBuilder } from '@/components/QuickMealBuilder';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Hero Section */}
      <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Hero Content */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span className="text-sm font-medium">AI-Powered Campus Dining</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-gray-900 dark:text-white">
              Discover Campus Eats
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              Your ultimate guide to campus dining with AI recommendations, nutrition tracking, and real-time updates.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dishes" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors">
                Explore Menu
              </Link>
              <Link href="/recommendations" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-zinc-700 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors">
                Get Recommendations
              </Link>
            </div>
          </div>

          {/* Live Stats Bar */}
          <LiveStats />
          
          {/* Meal Period Indicator */}
          <div className="mt-6">
            <MealPeriodIndicator />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Large Card - Venues */}
          <Link href="/venues" className="group lg:col-span-2 lg:row-span-2">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-6 h-full hover:shadow-lg hover:border-gray-300 dark:hover:border-zinc-600 transition-all">
              <div className="w-14 h-14 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-3xl mb-4">
                🏢
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-orange-500 transition-colors">
                Dining Venues
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Explore all campus dining locations, see real-time hours, and find what&apos;s open now.
              </p>
              <div className="flex items-center gap-2 text-orange-500 font-medium text-sm">
                View All Venues
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Medium Card - Menu */}
          <Link href="/dishes" className="group lg:col-span-2">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-5 h-full hover:shadow-lg hover:border-gray-300 dark:hover:border-zinc-600 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl">
                  🍕
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-500 transition-colors">
                    Browse Menu
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Full menu with nutrition info and dietary filters.
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Small Card - For You */}
          <Link href="/recommendations" className="group">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-5 h-full hover:shadow-lg hover:border-gray-300 dark:hover:border-zinc-600 transition-all text-center">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-xl mx-auto mb-3">
                ✨
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                For You
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                AI picks
              </p>
            </div>
          </Link>

          {/* Small Card - Favorites */}
          <Link href="/favorites" className="group">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-5 h-full hover:shadow-lg hover:border-gray-300 dark:hover:border-zinc-600 transition-all text-center">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-xl mx-auto mb-3">
                ❤️
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">
                Favorites
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Your picks
              </p>
            </div>
          </Link>
        </div>

        {/* Live Features Grid */}
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <LiveTrending />
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <NutritionDashboard />
          </div>
        </div>
        
        {/* Meal Planner */}
        <div className="mb-8 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
          <QuickMealBuilder />
        </div>

        {/* Features Section */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl overflow-hidden">
          <div className="p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
              Why Students Love Campus Eats
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { emoji: '🤖', title: 'AI Assistant', desc: 'Chat to find your perfect meal' },
                { emoji: '📊', title: 'Nutrition Tracking', desc: 'Track macros and daily intake' },
                { emoji: '🔥', title: 'Live Trending', desc: 'See what\'s popular now' },
                { emoji: '🎤', title: 'Voice Search', desc: 'Hands-free meal discovery' },
              ].map((feature, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-5 text-center hover:bg-white/20 transition-colors">
                  <div className="text-3xl mb-3">{feature.emoji}</div>
                  <h3 className="text-base font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-white/80 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 mb-8">
          <p className="text-gray-500 dark:text-gray-400 mb-3 text-sm">Ready to find your next favorite meal?</p>
          <Link href="/dishes" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium group">
            Start Exploring
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
