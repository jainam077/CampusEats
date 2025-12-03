'use client';

import { useState, useEffect } from 'react';

interface MealPeriod {
  name: string;
  icon: string;
  start: number; // hour in 24h format
  end: number;
  gradient: string;
  progressGradient: string;
}

const MEAL_PERIODS: MealPeriod[] = [
  { 
    name: 'Breakfast', 
    icon: '🌅', 
    start: 7, 
    end: 10, 
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    progressGradient: 'from-amber-400 to-orange-500'
  },
  { 
    name: 'Lunch', 
    icon: '☀️', 
    start: 11, 
    end: 14, 
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    progressGradient: 'from-orange-400 to-red-500'
  },
  { 
    name: 'Dinner', 
    icon: '🌙', 
    start: 17, 
    end: 20, 
    gradient: 'from-purple-500 via-violet-500 to-indigo-500',
    progressGradient: 'from-purple-400 to-indigo-500'
  },
];

export function MealPeriodIndicator() {
  const [currentPeriod, setCurrentPeriod] = useState<MealPeriod | null>(null);
  const [nextPeriod, setNextPeriod] = useState<MealPeriod | null>(null);
  const [countdown, setCountdown] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updatePeriod = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour + currentMinute / 60;

      // Find current period
      const active = MEAL_PERIODS.find(p => currentTime >= p.start && currentTime < p.end);
      setCurrentPeriod(active || null);

      // Calculate progress within current period
      if (active) {
        const totalMinutes = (active.end - active.start) * 60;
        const elapsedMinutes = (currentTime - active.start) * 60;
        setProgress((elapsedMinutes / totalMinutes) * 100);
      }

      // Find next period
      let next: MealPeriod | null = null;
      if (!active) {
        next = MEAL_PERIODS.find(p => p.start > currentTime) || MEAL_PERIODS[0];
      } else {
        const currentIndex = MEAL_PERIODS.indexOf(active);
        next = MEAL_PERIODS[(currentIndex + 1) % MEAL_PERIODS.length];
      }
      setNextPeriod(next);

      // Calculate countdown
      if (next) {
        let targetHour = next.start;
        if (active && MEAL_PERIODS.indexOf(next) <= MEAL_PERIODS.indexOf(active)) {
          // Next period is tomorrow
          targetHour += 24;
        }
        const hoursUntil = targetHour - currentTime;
        const hours = Math.floor(hoursUntil);
        const minutes = Math.floor((hoursUntil - hours) * 60);
        
        if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m`);
        } else {
          setCountdown(`${minutes}m`);
        }
      }
    };

    updatePeriod();
    const interval = setInterval(updatePeriod, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          {currentPeriod ? (
            <>
              {/* Active meal badge */}
              <div className={`relative px-4 py-2 rounded-2xl bg-gradient-to-r ${currentPeriod.gradient} shadow-md flex items-center gap-2.5`}>
                <span className="text-xl">{currentPeriod.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{currentPeriod.name}</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs text-white font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-24 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${currentPeriod.progressGradient} rounded-full transition-all duration-1000`}
                    style={{ width: `${100 - progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {Math.round(100 - progress)}% left
                </span>
              </div>
            </>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center gap-2.5">
              <span className="text-xl">😴</span>
              <span className="font-medium text-gray-600 dark:text-gray-300">Dining halls closed</span>
            </div>
          )}
        </div>
        
        {/* Next meal countdown */}
        {nextPeriod && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Next:</span>
            <span className="text-lg">{nextPeriod.icon}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{nextPeriod.name}</span>
            <span className="font-semibold text-orange-500">in {countdown}</span>
          </div>
        )}
      </div>
    </div>
  );
}
