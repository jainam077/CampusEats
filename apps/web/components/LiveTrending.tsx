'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dishes } from '@/lib/demoData';

interface TrendingItem {
  dish: typeof dishes[0];
  orderCount: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

export function LiveTrending() {
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Generate initial trending data
    const generateTrending = () => {
      const shuffled = [...dishes]
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(dish => ({
          dish,
          orderCount: Math.floor(Math.random() * 50) + 10,
          trend: (['up', 'down', 'stable'] as const)[Math.floor(Math.random() * 3)],
          percentChange: Math.floor(Math.random() * 30) + 5,
        }))
        .sort((a, b) => b.orderCount - a.orderCount);
      
      setTrending(shuffled);
      setLastUpdate(new Date());
    };

    generateTrending();

    // Simulate live updates
    const interval = setInterval(() => {
      if (isLive) {
        setTrending(prev => 
          prev.map(item => ({
            ...item,
            orderCount: item.orderCount + (Math.random() > 0.5 ? 1 : 0),
            trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : item.trend,
          })).sort((a, b) => b.orderCount - a.orderCount)
        );
        setLastUpdate(new Date());
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Trending Now</h2>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
              isLive 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                : 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
            {isLive ? 'Live' : 'Paused'}
          </button>
        </div>
        <span className="text-xs text-gray-400">
          {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Trending list */}
      <div className="space-y-2">
        {trending.map((item, index) => (
          <Link
            key={item.dish.dish_id}
            href={`/dishes/${item.dish.dish_id}`}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors group"
          >
            {/* Rank */}
            <div className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs ${
              index === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
              index === 1 ? 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400' :
              index === 2 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500' :
              'bg-gray-50 dark:bg-zinc-700/50 text-gray-400'
            }`}>
              {index + 1}
            </div>

            {/* Dish info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors truncate">
                {item.dish.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {item.dish.venue_name}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {item.orderCount}
              </span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                item.trend === 'up' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                item.trend === 'down' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                'bg-gray-50 dark:bg-zinc-700 text-gray-500'
              }`}>
                {item.trend === 'up' ? `+${item.percentChange}%` : 
                 item.trend === 'down' ? `-${item.percentChange}%` : 
                 '—'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
