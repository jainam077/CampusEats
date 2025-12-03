'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { venues, dishes } from '@/lib/demoData';
import { FavoriteButton } from '@/components/FavoriteButton';

export default function VenueDetailPage() {
  const params = useParams();
  const venueId = Number(params.id);
  
  const venue = venues.find(v => v.venue_id === venueId);
  const venueDishes = dishes.filter(d => d.venue_id === venueId);
  
  const breakfastDishes = venueDishes.filter(d => d.meal_type === 'breakfast').slice(0, 4);
  const lunchDishes = venueDishes.filter(d => d.meal_type === 'lunch').slice(0, 4);
  const dinnerDishes = venueDishes.filter(d => d.meal_type === 'dinner').slice(0, 4);

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Venue not found</h1>
          <Link href="/venues" className="text-emerald-600 hover:underline mt-4 inline-block">
            Back to venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/venues" className="text-emerald-600 dark:text-emerald-400 hover:underline mb-6 inline-block">
          Back to venues
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-5xl mb-4">🏛️</div>
                <h1 className="text-3xl font-bold">{venue.name}</h1>
                <p className="text-emerald-100 mt-2">📍 {venue.location}</p>
              </div>
              <FavoriteButton itemType="venue" itemId={venue.venue_id} size="lg" />
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h2>
              <p className="text-gray-600 dark:text-gray-400">{venue.description}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                🕐 Hours of Operation
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {venue.hours.breakfast && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🌅</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Breakfast</h3>
                    <p className="text-emerald-600 dark:text-emerald-400">{venue.hours.breakfast}</p>
                  </div>
                )}
                {venue.hours.lunch && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl mb-2">☀️</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Lunch</h3>
                    <p className="text-emerald-600 dark:text-emerald-400">{venue.hours.lunch}</p>
                  </div>
                )}
                {venue.hours.dinner && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🌙</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Dinner</h3>
                    <p className="text-emerald-600 dark:text-emerald-400">{venue.hours.dinner}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Todays Menu</h2>
                <Link 
                  href={"/dishes?venue=" + venue.venue_id}
                  className="text-emerald-600 dark:text-emerald-400 text-sm hover:underline"
                >
                  View Full Menu
                </Link>
              </div>
              
              {breakfastDishes.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    🌅 Breakfast Highlights
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {breakfastDishes.map(dish => (
                      <Link key={dish.dish_id} href={"/dishes/" + dish.dish_id}>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <span className="font-medium text-gray-900 dark:text-white">{dish.name}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">{dish.calories} cal</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {lunchDishes.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    ☀️ Lunch Highlights
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {lunchDishes.map(dish => (
                      <Link key={dish.dish_id} href={"/dishes/" + dish.dish_id}>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <span className="font-medium text-gray-900 dark:text-white">{dish.name}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">{dish.calories} cal</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {dinnerDishes.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    🌙 Dinner Highlights
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {dinnerDishes.map(dish => (
                      <Link key={dish.dish_id} href={"/dishes/" + dish.dish_id}>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <span className="font-medium text-gray-900 dark:text-white">{dish.name}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">{dish.calories} cal</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href={"/dishes?venue=" + venue.venue_id}
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                View Full Menu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
