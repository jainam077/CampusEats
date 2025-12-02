'use client';

import Link from 'next/link';
import { venues } from '@/lib/demoData';

// Helper to check if venue is currently open
function isVenueOpen(hours: { breakfast?: string; lunch?: string; dinner?: string }): { open: boolean; currentMeal: string } {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour + currentMinute / 60;

  // Parse time like "7:00 AM" to decimal hours
  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour + minute / 60;
  };

  // Check each meal period
  if (hours.breakfast) {
    const [start, end] = hours.breakfast.split(' - ');
    const startTime = parseTime(start);
    const endTime = parseTime(end);
    if (currentTime >= startTime && currentTime < endTime) {
      return { open: true, currentMeal: 'Breakfast' };
    }
  }
  if (hours.lunch) {
    const [start, end] = hours.lunch.split(' - ');
    const startTime = parseTime(start);
    const endTime = parseTime(end);
    if (currentTime >= startTime && currentTime < endTime) {
      return { open: true, currentMeal: 'Lunch' };
    }
  }
  if (hours.dinner) {
    const [start, end] = hours.dinner.split(' - ');
    const startTime = parseTime(start);
    const endTime = parseTime(end);
    if (currentTime >= startTime && currentTime < endTime) {
      return { open: true, currentMeal: 'Dinner' };
    }
  }

  return { open: false, currentMeal: '' };
}

export default function VenuesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dining Venues
            </h1>
            <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-medium rounded-lg">
              {venues.length} locations
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Explore all campus dining locations</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((venue) => {
            const status = isVenueOpen(venue.hours);
            return (
              <Link key={venue.venue_id} href={`/venues/${venue.venue_id}`}>
                <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-5 h-full hover:shadow-lg hover:border-gray-300 dark:hover:border-zinc-600 transition-all duration-200 group">
                  {/* Header with status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-2xl">
                      🏛️
                    </div>
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      status.open 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {status.open ? `Open · ${status.currentMeal}` : 'Closed'}
                    </div>
                  </div>

                  {/* Name */}
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-orange-500 transition-colors">
                    {venue.name}
                  </h2>

                  {/* Location */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {venue.location}
                  </p>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {venue.description}
                  </p>

                  {/* Hours */}
                  <div className="border-t border-gray-100 dark:border-zinc-700 pt-4 space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Hours</h3>
                    {venue.hours.breakfast && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Breakfast</span>
                        <span className="text-gray-900 dark:text-white font-medium">{venue.hours.breakfast}</span>
                      </div>
                    )}
                    {venue.hours.lunch && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Lunch</span>
                        <span className="text-gray-900 dark:text-white font-medium">{venue.hours.lunch}</span>
                      </div>
                    )}
                    {venue.hours.dinner && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Dinner</span>
                        <span className="text-gray-900 dark:text-white font-medium">{venue.hours.dinner}</span>
                      </div>
                    )}
                  </div>

                  {/* View Menu Button */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700">
                    <span className="text-orange-500 text-sm font-medium flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      View Menu 
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
