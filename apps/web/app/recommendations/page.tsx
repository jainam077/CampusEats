'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dishes, type Dish } from '@/lib/demoData';
import { FavoriteButton } from '@/components/FavoriteButton';

interface Recommendation {
  dish: Dish;
  score: number;
  reason: string;
}

const DIETARY_OPTIONS = [
  { value: '', label: 'All Diets' },
  { value: 'vegetarian', label: '🥬 Vegetarian' },
  { value: 'vegan', label: '🌱 Vegan' },
  { value: 'gluten-free', label: '🌾 Gluten Free' },
  { value: 'halal', label: '☪️ Halal' },
  { value: 'kosher', label: '✡️ Kosher' },
  { value: 'dairy-free', label: '🥛 Dairy Free' },
  { value: 'nut-free', label: '🥜 Nut Free' },
  { value: 'low-sodium', label: '🧂 Low Sodium' },
  { value: 'low-carb', label: '🍞 Low Carb' },
  { value: 'high-protein', label: '💪 High Protein' },
];

function generateRecommendations(allDishes: Dish[], dietary: string): Recommendation[] {
  let filtered = [...allDishes];
  if (dietary) {
    filtered = filtered.filter(d => 
      d.dietary_tags?.some(tag => tag.toLowerCase().includes(dietary.toLowerCase()))
    );
  }
  
  const scored: Recommendation[] = filtered.map(dish => {
    let score = 0;
    let reason = '';
    if (dish.avg_rating && dish.avg_rating >= 4.5) { score += 0.3; reason = '⭐ Highly rated by students'; }
    else if (dish.avg_rating && dish.avg_rating >= 4.0) { score += 0.2; reason = '👍 Popular choice'; }
    if (dish.protein && dish.protein >= 25) { score += 0.15; if (!reason) reason = '💪 Great protein source'; }
    if (dish.calories && dish.calories < 500) { score += 0.1; if (!reason) reason = '🥗 Lighter option'; }
    if (dish.dietary_tags?.includes('vegan')) { score += 0.1; if (!reason) reason = '🌱 Plant-powered choice'; }
    if (dish.review_count && dish.review_count >= 20) { score += 0.15; if (!reason) reason = '🔥 Trending on campus'; }
    if (!reason) reason = '✨ Try something new';
    return { dish, score, reason };
  });
  
  return scored.sort((a, b) => b.score - a.score).slice(0, 8);
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dietary, setDietary] = useState('');

  useEffect(() => {
    const recs = generateRecommendations(dishes, dietary);
    setRecommendations(recs);
  }, [dietary]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              For You
            </h1>
            <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-lg">
              AI Picks
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Personalized recommendations based on your preferences</p>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDietary(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dietary === opt.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No matches found</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Try a different dietary filter to see more options.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={rec.dish.dish_id} className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-600 transition-all duration-200 group">
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-amber-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-amber-700' :
                    'bg-purple-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link href={`/dishes/${rec.dish.dish_id}`} className="group-hover:text-purple-500 transition-colors">
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{rec.dish.name}</h2>
                        </Link>
                        <p className="text-purple-500 dark:text-purple-400 text-sm mt-0.5 font-medium">{rec.reason}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {rec.dish.avg_rating && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-amber-700 dark:text-amber-400 font-semibold text-sm">{rec.dish.avg_rating}</span>
                          </div>
                        )}
                        <FavoriteButton itemType="dish" itemId={rec.dish.dish_id} size="md" />
                      </div>
                    </div>
                    {rec.dish.description && <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-1">{rec.dish.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="px-2 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-md text-xs font-medium">{rec.dish.calories} cal</span>
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium">{rec.dish.protein}g protein</span>
                      <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-md text-xs font-medium">{rec.dish.carbs}g carbs</span>
                      {rec.dish.dietary_tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-md text-xs font-medium capitalize">{tag.replace(/-/g, ' ')}</span>
                      ))}
                    </div>
                    {rec.dish.allergens && rec.dish.allergens.length > 0 && (
                      <div className="mt-2 text-xs text-red-500 dark:text-red-400">⚠️ {rec.dish.allergens.slice(0, 3).join(', ')}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
