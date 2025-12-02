'use client';

import { useState, useEffect } from 'react';

interface NutritionData {
  day: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const GOALS = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 78,
};

export function NutritionDashboard() {
  const [weeklyData, setWeeklyData] = useState<NutritionData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'calories' | 'protein' | 'carbs' | 'fat'>('calories');
  const [animatedValues, setAnimatedValues] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    // Generate demo weekly data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay();
    
    const data: NutritionData[] = days.map((day, i) => ({
      day,
      calories: i <= today ? Math.floor(Math.random() * 800) + 1400 : 0,
      protein: i <= today ? Math.floor(Math.random() * 40) + 30 : 0,
      carbs: i <= today ? Math.floor(Math.random() * 150) + 150 : 0,
      fat: i <= today ? Math.floor(Math.random() * 40) + 40 : 0,
    }));
    
    setWeeklyData(data);

    // Animate today's values
    const todayData = data[today] || data[data.length - 1];
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      setAnimatedValues({
        calories: Math.floor(todayData.calories * eased),
        protein: Math.floor(todayData.protein * eased),
        carbs: Math.floor(todayData.carbs * eased),
        fat: Math.floor(todayData.fat * eased),
      });
      
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const todayData = weeklyData[new Date().getDay()] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const maxValue = Math.max(...weeklyData.map(d => d[selectedMetric])) || 1;

  const metrics = [
    { key: 'calories' as const, label: 'Calories', color: 'orange', unit: '', goal: GOALS.calories },
    { key: 'protein' as const, label: 'Protein', color: 'blue', unit: 'g', goal: GOALS.protein },
    { key: 'carbs' as const, label: 'Carbs', color: 'yellow', unit: 'g', goal: GOALS.carbs },
    { key: 'fat' as const, label: 'Fat', color: 'red', unit: 'g', goal: GOALS.fat },
  ];

  return (
    <div className="p-5">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Nutrition This Week
      </h2>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        {metrics.map(({ key, label, color, unit, goal }) => {
          const value = animatedValues[key];
          const percentage = Math.min((value / goal) * 100, 100);
          const colorClasses: { bg: string; light: string; text: string } = {
            orange: { bg: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
            blue: { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
            yellow: { bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
            red: { bg: 'bg-red-500', light: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
          }[color] || { bg: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-600' };
          
          return (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`p-3 rounded-lg transition-all border ${
                selectedMetric === key 
                  ? `${colorClasses.light} border-current ${colorClasses.text}` 
                  : `bg-white dark:bg-zinc-700/50 border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500`
              }`}
            >
              <div className={`text-xs mb-1 ${selectedMetric === key ? colorClasses.text : 'text-gray-500 dark:text-gray-400'}`}>{label}</div>
              <div className={`text-lg font-bold ${selectedMetric === key ? colorClasses.text : 'text-gray-900 dark:text-white'}`}>
                {value.toLocaleString()}{unit}
              </div>
              <div className="mt-1.5 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-600">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${colorClasses.bg}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-xs mt-1 text-gray-400">
                {Math.round(percentage)}% of goal
              </div>
            </button>
          );
        })}
      </div>

      {/* Weekly Bar Chart */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
          Weekly {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
        </h3>
        <div className="flex items-end gap-1.5 h-24 p-3 rounded-lg bg-gray-50 dark:bg-zinc-700/50">
          {weeklyData.map((data, i) => {
            const height = (data[selectedMetric] / maxValue) * 100;
            const isToday = i === new Date().getDay();
            const colorBg = {
              calories: 'bg-orange-500',
              protein: 'bg-blue-500',
              carbs: 'bg-amber-500',
              fat: 'bg-red-500',
            };
            
            return (
              <div key={data.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div 
                    className={`w-full rounded-t transition-all duration-700 ${
                      data[selectedMetric] === 0 
                        ? 'bg-gray-200 dark:bg-zinc-600' 
                        : isToday 
                          ? colorBg[selectedMetric]
                          : 'bg-gray-300 dark:bg-zinc-500'
                    }`}
                    style={{ 
                      height: `${Math.max(height, 5)}%`,
                    }}
                  />
                </div>
                <span className={`text-xs ${isToday ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                  {data.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-100 dark:border-orange-800/30">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Insight</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {todayData.protein >= GOALS.protein * 0.8 
                ? "Great protein intake today! 💪"
                : "Add a high-protein option to meet your daily goal."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
