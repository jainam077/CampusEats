'use client';

import { useState, useEffect } from 'react';

interface StatItem {
  label: string;
  value: number;
  suffix: string;
  icon: string;
  color: string;
}

export function LiveStats() {
  const [stats, setStats] = useState<StatItem[]>([
    { label: 'Meals Today', value: 0, suffix: '', icon: '🍽️', color: 'orange' },
    { label: 'Online Now', value: 0, suffix: '', icon: '👥', color: 'purple' },
    { label: 'Avg Wait', value: 0, suffix: ' min', icon: '⏱️', color: 'amber' },
    { label: 'Satisfaction', value: 0, suffix: '%', icon: '😊', color: 'green' },
  ]);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const targets = [1847, 342, 4, 96];
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setStats(prev => prev.map((stat, i) => ({
        ...stat,
        value: Math.floor(targets[i] * eased)
      })));
      
      if (step >= steps) {
        clearInterval(timer);
        startLiveUpdates();
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const startLiveUpdates = () => {
    setInterval(() => {
      setStats(prev => prev.map((stat, i) => {
        if (i === 0) return { ...stat, value: stat.value + (Math.random() > 0.7 ? 1 : 0) };
        if (i === 1) return { ...stat, value: Math.max(280, Math.min(400, stat.value + (Math.random() > 0.5 ? 1 : -1))) };
        if (i === 2) return { ...stat, value: Math.max(2, Math.min(8, stat.value + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))) };
        return stat;
      }));
    }, 3000);
  };

  const colorMap: Record<string, { text: string; bg: string; dot: string }> = {
    orange: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', dot: 'bg-orange-500' },
    purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', dot: 'bg-purple-500' },
    amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', dot: 'bg-amber-500' },
    green: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', dot: 'bg-green-500' },
  };

  return (
    <div className={`flex flex-wrap justify-center gap-3 md:gap-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {stats.map((stat, index) => {
        const colors = colorMap[stat.color];
        return (
          <div 
            key={stat.label}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${colors.bg} transition-all duration-200 hover:scale-105`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <div className={`text-xl font-bold ${colors.text}`}>
                {stat.value.toLocaleString()}{stat.suffix}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
                {index < 3 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
                )}
                {stat.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
