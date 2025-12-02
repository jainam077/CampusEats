'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dishes, type Dish } from '@/lib/demoData';

interface MealSlot {
  period: 'breakfast' | 'lunch' | 'dinner';
  icon: string;
  dish: Dish | null;
}

// Categorize dishes by keywords in name/description for meal periods
function categorizeDishes() {
  const breakfast: Dish[] = [];
  const lunch: Dish[] = [];
  const dinner: Dish[] = [];
  
  const breakfastKeywords = ['bacon', 'egg', 'pancake', 'waffle', 'biscuit', 'oatmeal', 'muffin', 'yogurt', 'breakfast', 'sausage', 'toast', 'cereal', 'bagel', 'croissant'];
  const dinnerKeywords = ['steak', 'pasta', 'salmon', 'roast', 'grilled chicken', 'shrimp', 'risotto', 'filet', 'ribeye', 'lobster'];
  
  dishes.forEach(dish => {
    const nameLower = dish.name.toLowerCase();
    const descLower = (dish.description || '').toLowerCase();
    const combined = nameLower + ' ' + descLower;
    
    if (breakfastKeywords.some(kw => combined.includes(kw))) {
      breakfast.push(dish);
    } else if (dinnerKeywords.some(kw => combined.includes(kw))) {
      dinner.push(dish);
    } else {
      lunch.push(dish);
    }
  });
  
  // Ensure we have dishes for each category, fallback to all dishes if empty
  return {
    breakfast: breakfast.length > 0 ? breakfast.slice(0, 8) : dishes.slice(0, 8),
    lunch: lunch.length > 0 ? lunch.slice(0, 8) : dishes.slice(8, 16),
    dinner: dinner.length > 0 ? dinner.slice(0, 8) : dishes.slice(16, 24),
  };
}

export function QuickMealBuilder() {
  const [slots, setSlots] = useState<MealSlot[]>([
    { period: 'breakfast', icon: '🌅', dish: null },
    { period: 'lunch', icon: '☀️', dish: null },
    { period: 'dinner', icon: '🌙', dish: null },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const categorized = categorizeDishes();
  
  const getDishesForPeriod = (period: string) => {
    return categorized[period as keyof typeof categorized] || dishes.slice(0, 8);
  };

  const selectDish = (slotIndex: number, dish: Dish) => {
    setSlots(prev => prev.map((slot, i) => 
      i === slotIndex ? { ...slot, dish } : slot
    ));
    setActiveSlot(null);
  };

  const removeDish = (slotIndex: number) => {
    setSlots(prev => prev.map((slot, i) => 
      i === slotIndex ? { ...slot, dish: null } : slot
    ));
  };

  const totalNutrition = slots.reduce((acc, slot) => {
    if (slot.dish) {
      acc.calories += slot.dish.calories;
      acc.protein += slot.dish.protein;
      acc.carbs += slot.dish.carbs;
      acc.fat += slot.dish.fat;
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const filledSlots = slots.filter(s => s.dish).length;

  return (
    <div className="relative">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xl">
            📋
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white">Meal Planner</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filledSlots === 0 ? 'Plan your day' : `${filledSlots}/3 meals planned`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {filledSlots > 0 && (
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg text-sm font-medium">
              {totalNutrition.calories} cal
            </span>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-zinc-700 pt-4 overflow-visible">
          {/* Meal Slots */}
          <div className="grid md:grid-cols-3 gap-3 relative overflow-visible" style={{ minHeight: activeSlot !== null ? '220px' : 'auto' }}>
            {slots.map((slot, index) => (
              <div key={slot.period} className="relative overflow-visible">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <span>{slot.icon}</span> {slot.period.charAt(0).toUpperCase() + slot.period.slice(1)}
                </div>
                
                {slot.dish ? (
                  <div className="bg-gray-50 dark:bg-zinc-700/50 rounded-lg p-3 relative group">
                    <button
                      onClick={() => removeDish(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                    <Link href={`/dishes/${slot.dish.dish_id}`}>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm hover:text-orange-500 transition-colors truncate">
                        {slot.dish.name}
                      </h4>
                    </Link>
                    <div className="flex gap-1.5 mt-1.5">
                      <span className="px-1.5 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded text-xs">{slot.dish.calories} cal</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">{slot.dish.protein}g</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSlot(activeSlot === index ? null : index);
                    }}
                    className={`w-full h-20 border-2 border-dashed rounded-lg flex items-center justify-center transition-all ${
                      activeSlot === index
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-zinc-600 hover:border-orange-300 dark:hover:border-orange-700'
                    }`}
                  >
                    <span className="text-gray-400 text-sm">+ Add</span>
                  </button>
                )}

                {/* Dish Selector Dropdown */}
                {activeSlot === index && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-2xl border border-gray-200 dark:border-zinc-700 z-[9999] max-h-48 overflow-y-auto" style={{ top: '100%' }}>
                    {getDishesForPeriod(slot.period).length === 0 ? (
                      <div className="px-3 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No dishes available
                      </div>
                    ) : (
                      getDishesForPeriod(slot.period).map(dish => (
                        <button
                          key={dish.dish_id}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectDish(index, dish);
                          }}
                          className="w-full px-3 py-2.5 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors border-b border-gray-100 dark:border-zinc-700 last:border-0"
                        >
                          <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{dish.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{dish.calories} cal • {dish.protein}g protein</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Nutrition Summary */}
          {filledSlots > 0 && (
            <div className="bg-gray-50 dark:bg-zinc-700/50 rounded-lg p-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Daily Total</h4>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-orange-500">{totalNutrition.calories}</div>
                  <div className="text-xs text-gray-400">cal</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-500">{totalNutrition.protein}g</div>
                  <div className="text-xs text-gray-400">protein</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-amber-500">{totalNutrition.carbs}g</div>
                  <div className="text-xs text-gray-400">carbs</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-500">{totalNutrition.fat}g</div>
                  <div className="text-xs text-gray-400">fat</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
