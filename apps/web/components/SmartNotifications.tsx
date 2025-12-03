'use client';

import { useState, useEffect, useCallback } from 'react';
import { dishes } from '@/lib/demoData';

interface NotificationPreference {
  mealReminders: boolean;
  dietaryAlerts: boolean;
  trendingDishes: boolean;
  limitedSpecials: boolean;
  favoriteAvailable: boolean;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'meal' | 'dietary' | 'trending' | 'favorite' | 'special';
}

export default function SmartNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreference>({
    mealReminders: true,
    dietaryAlerts: true,
    trendingDishes: true,
    limitedSpecials: false,
    favoriteAvailable: true,
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<string[]>([]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    
    // Load preferences from localStorage
    const saved = localStorage.getItem('notificationPrefs');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
    
    // Generate scheduled notifications
    generateScheduledNotifications();
  }, []);

  const generateScheduledNotifications = () => {
    const now = new Date();
    const notifications: ScheduledNotification[] = [];
    
    // Breakfast reminder (8 AM)
    if (now.getHours() < 8) {
      notifications.push({
        id: '1',
        title: '🍳 Breakfast Time!',
        body: 'Fresh Waffle Bar is available at The Commons. Start your day right!',
        time: '8:00 AM',
        type: 'meal'
      });
    }
    
    // Lunch reminder (11:30 AM)
    if (now.getHours() < 12) {
      notifications.push({
        id: '2',
        title: '🍽️ Lunch is Ready',
        body: 'Beat the rush! Grilled Chicken Bowl trending at Panther Dining Hall.',
        time: '11:30 AM',
        type: 'meal'
      });
    }
    
    // Dinner reminder (5:30 PM)
    if (now.getHours() < 18) {
      notifications.push({
        id: '3',
        title: '🌙 Dinner Time',
        body: 'Tonight\'s special: Herb-Crusted Salmon at Piedmont Central.',
        time: '5:30 PM',
        type: 'meal'
      });
    }
    
    // Trending alert
    notifications.push({
      id: '4',
      title: '🔥 Trending Now',
      body: 'Korean BBQ Tacos just became #1! 47 orders in the last hour.',
      time: 'Live',
      type: 'trending'
    });
    
    // Dietary alert
    notifications.push({
      id: '5',
      title: '🥗 New Vegan Option!',
      body: 'Mediterranean Bowl (Vegan, GF) just added at The Commons.',
      time: 'Just now',
      type: 'dietary'
    });
    
    setScheduledNotifications(notifications);
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Show welcome notification
        new Notification('🎉 Notifications Enabled!', {
          body: 'You\'ll receive smart meal reminders and trending alerts.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
        
        setRecentNotifications(prev => ['Notifications enabled successfully!', ...prev]);
      }
    }
  };

  const sendTestNotification = useCallback((type: string) => {
    if (permission !== 'granted') {
      alert('Please enable notifications first!');
      return;
    }

    const randomDish = dishes[Math.floor(Math.random() * dishes.length)];
    
    const notifications: Record<string, { title: string; body: string }> = {
      meal: {
        title: '🍽️ Time to Eat!',
        body: `${randomDish.name} is available now at ${randomDish.venue_name}. Rated ${randomDish.avg_rating}⭐`,
      },
      dietary: {
        title: '🥗 Matches Your Diet!',
        body: `New dish alert: ${randomDish.name} - ${(randomDish.dietary_tags || []).join(', ')}`,
      },
      trending: {
        title: '🔥 Trending on Campus',
        body: `${randomDish.name} is blowing up! ${Math.floor(Math.random() * 50 + 20)} orders in the last hour.`,
      },
      favorite: {
        title: '⭐ Your Favorite is Back!',
        body: `${randomDish.name} is available today at ${randomDish.venue_name}!`,
      },
      special: {
        title: '✨ Limited Time Special!',
        body: `${randomDish.name} is only available today at ${randomDish.venue_name}! Don't miss out!`,
      },
    };

    const notif = notifications[type] || notifications.meal;
    
    new Notification(notif.title, {
      body: notif.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: type,
      requireInteraction: false,
    });

    setRecentNotifications(prev => [notif.title, ...prev.slice(0, 4)]);
  }, [permission]);

  const togglePreference = (key: keyof NotificationPreference) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    localStorage.setItem('notificationPrefs', JSON.stringify(updated));
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Smart Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* Notification badge */}
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
          {scheduledNotifications.length}
        </span>
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  🔔 Smart Notifications
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
              <p className="text-sm opacity-90 mt-1">AI-powered meal reminders & alerts</p>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Permission Status */}
              <div className="mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium">Notification Status</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {permission === 'granted' ? '✅ Enabled' : permission === 'denied' ? '❌ Blocked' : '⏳ Not set'}
                    </p>
                  </div>
                  {permission === 'default' && (
                    <button
                      onClick={requestPermission}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium"
                    >
                      Enable
                    </button>
                  )}
                </div>
                
                {/* Instructions for blocked notifications */}
                {permission === 'denied' && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Notifications are blocked
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      To enable notifications:
                    </p>
                    <ol className="text-xs text-red-700 dark:text-red-300 mt-1 ml-4 list-decimal">
                      <li>Click the 🔒 lock icon in your browser address bar</li>
                      <li>Find &quot;Notifications&quot; setting</li>
                      <li>Change from &quot;Block&quot; to &quot;Allow&quot;</li>
                      <li>Refresh the page</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Scheduled Notifications */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  📅 Upcoming Alerts
                </h3>
                <div className="space-y-2">
                  {scheduledNotifications.map(notif => (
                    <div
                      key={notif.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-orange-500"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{notif.title}</span>
                        <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{notif.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Notifications */}
              {permission === 'granted' && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    🧪 Test Notifications
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => sendTestNotification('meal')}
                      className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                    >
                      🍽️ Meal Reminder
                    </button>
                    <button
                      onClick={() => sendTestNotification('trending')}
                      className="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-800 transition"
                    >
                      🔥 Trending Alert
                    </button>
                    <button
                      onClick={() => sendTestNotification('dietary')}
                      className="p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-800 transition"
                    >
                      🥗 Dietary Match
                    </button>
                    <button
                      onClick={() => sendTestNotification('favorite')}
                      className="p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm hover:bg-yellow-200 dark:hover:bg-yellow-800 transition"
                    >
                      ⭐ Favorite Alert
                    </button>
                    <button
                      onClick={() => sendTestNotification('special')}
                      className="col-span-2 p-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg text-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition"
                    >
                      ✨ Limited Time Special
                    </button>
                  </div>
                </div>
              )}

              {/* Preferences */}
              <div className="mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  ⚙️ Notification Preferences
                </h3>
                <div className="space-y-2">
                  {[
                    { key: 'mealReminders', label: 'Meal Time Reminders', icon: '🍽️' },
                    { key: 'dietaryAlerts', label: 'Dietary Match Alerts', icon: '🥗' },
                    { key: 'trendingDishes', label: 'Trending Dish Alerts', icon: '🔥' },
                    { key: 'limitedSpecials', label: 'Limited Time Specials', icon: '✨' },
                    { key: 'favoriteAvailable', label: 'Favorite Available', icon: '⭐' },
                  ].map(({ key, label, icon }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    >
                      <span className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="text-sm">{label}</span>
                      </span>
                      <div
                        onClick={() => togglePreference(key as keyof NotificationPreference)}
                        className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                          preferences[key as keyof NotificationPreference]
                            ? 'bg-orange-500'
                            : 'bg-gray-300 dark:bg-gray-500'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform mt-0.5 ${
                            preferences[key as keyof NotificationPreference]
                              ? 'translate-x-6'
                              : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              {recentNotifications.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    📬 Recent Activity
                  </h3>
                  <div className="space-y-1">
                    {recentNotifications.map((notif, i) => (
                      <div key={i} className="text-sm text-gray-600 dark:text-gray-300 py-1 border-b border-gray-100 dark:border-gray-700">
                        {notif}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
