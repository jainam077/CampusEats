'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dishes, venues, Dish, Venue } from '@/lib/demoData';

interface LocationState {
  status: 'idle' | 'detecting' | 'found' | 'not-found' | 'error';
  venue: Venue | null;
  distance: number | null;
  menuItems: Dish[];
  isSimulated: boolean;
}

// GSU Dining Hall Coordinates (approximate)
const VENUE_LOCATIONS: Record<string, { lat: number; lng: number; radius: number }> = {
  'Panther Dining Hall': { lat: 33.7530, lng: -84.3853, radius: 100 },
  'The Commons': { lat: 33.7545, lng: -84.3865, radius: 100 },
  'Piedmont Central': { lat: 33.7560, lng: -84.3840, radius: 100 },
};

export default function LocationMenuDetector() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<LocationState>({
    status: 'idle',
    venue: null,
    distance: null,
    menuItems: [],
    isSimulated: false,
  });
  const [manualSelect, setManualSelect] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');

  useEffect(() => {
    // Determine current meal based on time
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) {
      setCurrentMeal('breakfast');
    } else if (hour >= 11 && hour < 16) {
      setCurrentMeal('lunch');
    } else {
      setCurrentMeal('dinner');
    }
  }, []);

  const detectLocation = async () => {
    setLocation({ ...location, status: 'detecting', isSimulated: false });

    if (!navigator.geolocation) {
      setLocation({
        status: 'error',
        venue: null,
        distance: null,
        menuItems: [],
        isSimulated: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Find nearest venue
        let nearestVenue: Venue | null = null;
        let nearestDistance = Infinity;

        for (const venue of venues) {
          const coords = VENUE_LOCATIONS[venue.name];
          if (coords) {
            const distance = calculateDistance(latitude, longitude, coords.lat, coords.lng);
            if (distance < nearestDistance) {
              nearestDistance = distance;
              nearestVenue = venue;
            }
          }
        }

        if (nearestVenue && nearestDistance < 500) { // Within 500 meters
          const menuItems = dishes.filter(d => d.venue_name === nearestVenue!.name);
          setLocation({
            status: 'found',
            venue: nearestVenue,
            distance: Math.round(nearestDistance),
            menuItems,
            isSimulated: false,
          });
        } else {
          // For demo purposes, simulate being at a venue
          simulateNearbyVenue();
        }
      },
      (error) => {
        console.log('Geolocation error, simulating for demo:', error);
        // For demo, simulate being at a venue
        simulateNearbyVenue();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const simulateNearbyVenue = () => {
    // For demo: pretend user is at a random venue
    const randomVenue = venues[Math.floor(Math.random() * venues.length)];
    const menuItems = dishes.filter(d => d.venue_name === randomVenue.name);
    
    setLocation({
      status: 'found',
      venue: randomVenue,
      distance: null, // Don't show fake distance
      menuItems,
      isSimulated: true, // Mark as simulated
    });
  };

  const selectVenue = (venue: Venue) => {
    const menuItems = dishes.filter(d => d.venue_name === venue.name);
    setLocation({
      status: 'found',
      venue,
      distance: null,
      menuItems,
      isSimulated: false,
    });
    setManualSelect(false);
  };

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getMealIcon = () => {
    switch (currentMeal) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
    }
  };

  return (
    <>
      {/* Location Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-40 right-6 z-40 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Find Nearby Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Location Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  📍 Location Menu Finder
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm opacity-90 mt-1">
                Auto-detect which dining hall you&apos;re at
              </p>
            </div>

            <div className="p-4 overflow-y-auto max-h-[65vh]">
              {/* Current Meal Time */}
              <div className="mb-4 p-3 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getMealIcon()}</span>
                  <div>
                    <p className="font-medium capitalize">{currentMeal} Time</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Showing {currentMeal} menu items
                    </p>
                  </div>
                </div>
              </div>

              {/* Detection Status */}
              {location.status === 'idle' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📍</div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Detect which dining hall you&apos;re near to see today&apos;s menu
                  </p>
                  <button
                    onClick={detectLocation}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition"
                  >
                    🎯 Detect My Location
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    or{' '}
                    <button
                      onClick={() => setManualSelect(true)}
                      className="text-blue-500 hover:underline"
                    >
                      select dining hall manually
                    </button>
                  </p>
                </div>
              )}

              {location.status === 'detecting' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4 animate-pulse">📡</div>
                  <p className="text-gray-600 dark:text-gray-300">
                    Detecting your location...
                  </p>
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                </div>
              )}

              {/* Manual Selection */}
              {manualSelect && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Select Dining Hall</h3>
                  <div className="grid gap-2">
                    {venues.map(venue => (
                      <button
                        key={venue.venue_id}
                        onClick={() => selectVenue(venue)}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition border-2 border-transparent hover:border-blue-500"
                      >
                        <div className="font-medium">{venue.name}</div>
                        <div className="text-sm text-gray-500">{venue.location}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setManualSelect(false)}
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to auto-detect
                  </button>
                </div>
              )}

              {/* Found Venue */}
              {location.status === 'found' && location.venue && (
                <>
                  {/* Venue Info */}
                  {/* Demo Mode Banner */}
                  {location.isSimulated && (
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎭</span>
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">Demo Mode</p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            You&apos;re not on campus. Showing sample menu for demo purposes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">✅</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{location.venue.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {location.venue.location}
                        </p>
                        {location.distance && !location.isSimulated && (
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            📍 {location.distance}m away
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-green-200 dark:bg-green-800 px-2 py-1 rounded-full">
                            {location.venue.hours?.lunch || '7 AM - 10 PM'}
                          </span>
                          <span className="text-xs bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded-full">
                            Open Now
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">
                        Today&apos;s {currentMeal.charAt(0).toUpperCase() + currentMeal.slice(1)} Menu
                      </h3>
                      <span className="text-sm text-gray-500">
                        {location.menuItems.length} items
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {location.menuItems.slice(0, 8).map(dish => (
                        <Link
                          key={dish.dish_id}
                          href={`/dishes/${dish.dish_id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                        >
                          <div className="text-3xl">
                            {dish.image_url || '🍽️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{dish.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>⭐ {dish.avg_rating}</span>
                              <span>•</span>
                              <span>{dish.calories} cal</span>
                            </div>
                            {dish.dietary_tags && dish.dietary_tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {dish.dietary_tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                    </div>

                    {location.menuItems.length > 8 && (
                      <Link
                        href={`/venues/${location.venue.venue_id}`}
                        onClick={() => setIsOpen(false)}
                        className="block text-center mt-4 text-blue-500 hover:underline"
                      >
                        View all {location.menuItems.length} items →
                      </Link>
                    )}
                  </div>

                  {/* Change Location */}
                  <button
                    onClick={() => {
                      setLocation({ status: 'idle', venue: null, distance: null, menuItems: [], isSimulated: false });
                      setManualSelect(false);
                    }}
                    className="w-full mt-4 p-3 text-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    🔄 Detect Different Location
                  </button>
                </>
              )}

              {/* Error State */}
              {location.status === 'error' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">❌</div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Couldn&apos;t access your location
                  </p>
                  <button
                    onClick={() => setManualSelect(true)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition"
                  >
                    Select Manually Instead
                  </button>
                </div>
              )}

              {/* How it works */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  💡 How It Works
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Uses GPS to detect which dining hall you&apos;re near</li>
                  <li>• Shows real-time menu for current meal period</li>
                  <li>• Works even without QR codes at the venue</li>
                  <li>• Tap any dish to see full details & nutrition</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
