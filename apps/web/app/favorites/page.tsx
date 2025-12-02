'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dishes, venues, type Dish } from '@/lib/demoData';

interface FavoriteItem {
  type: 'dish' | 'venue';
  id: number;
  data: Dish | typeof venues[0];
}

function getFavorites(): { dishes: number[]; venues: number[] } {
  if (typeof window === 'undefined') return { dishes: [], venues: [] };
  const stored = localStorage.getItem('favorites');
  return stored ? JSON.parse(stored) : { dishes: [], venues: [] };
}

export default function FavoritesPage() {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'dish' | 'venue'>('all');

  useEffect(() => {
    function loadFavorites() {
      const favorites = getFavorites();
      const items: FavoriteItem[] = [];
      
      favorites.dishes.forEach(dishId => {
        const dish = dishes.find(d => d.dish_id === dishId);
        if (dish) {
          items.push({ type: 'dish', id: dishId, data: dish });
        }
      });
      
      favorites.venues.forEach(venueId => {
        const venue = venues.find(v => v.venue_id === venueId);
        if (venue) {
          items.push({ type: 'venue', id: venueId, data: venue });
        }
      });
      
      setFavoriteItems(items);
    }
    
    loadFavorites();
    
    const handleUpdate = () => loadFavorites();
    window.addEventListener('favoritesUpdated', handleUpdate);
    return () => window.removeEventListener('favoritesUpdated', handleUpdate);
  }, []);

  const removeFavorite = (type: 'dish' | 'venue', id: number) => {
    const favorites = getFavorites();
    const key = type === 'dish' ? 'dishes' : 'venues';
    favorites[key] = favorites[key].filter((itemId: number) => itemId !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: favorites }));
    setFavoriteItems(prev => prev.filter(item => !(item.type === type && item.id === id)));
  };

  const filteredFavorites = filter === 'all' 
    ? favoriteItems 
    : favoriteItems.filter(f => f.type === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Favorites
            </h1>
            <span className="px-2.5 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 text-sm font-medium rounded-lg">
              {favoriteItems.length} saved
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">All your saved dishes and venues in one place</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          {(['all', 'dish', 'venue'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === type
                  ? 'bg-orange-500 text-white'
                  : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
              }`}
            >
              {type === 'all' ? 'All' : type === 'dish' ? 'Dishes' : 'Venues'}
              {type !== 'all' && (
                <span className="ml-1.5 opacity-75">
                  ({favoriteItems.filter(f => f.type === type).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        {favoriteItems.length > 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 mb-6 flex justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{favoriteItems.length}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{favoriteItems.filter(f => f.type === 'dish').length}</div>
              <div className="text-xs text-gray-500">Dishes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{favoriteItems.filter(f => f.type === 'venue').length}</div>
              <div className="text-xs text-gray-500">Venues</div>
            </div>
          </div>
        )}

        {filteredFavorites.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 text-center py-16">
            <div className="text-5xl mb-4">💔</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No favorites yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm max-w-sm mx-auto">
              Start exploring and tap the heart icon to save your favorites!
            </p>
            <Link 
              href="/dishes" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFavorites.map((fav) => {
              const isDish = fav.type === 'dish';
              const dish = isDish ? (fav.data as Dish) : null;
              const venue = !isDish ? (fav.data as typeof venues[0]) : null;
              
              return (
                <div 
                  key={fav.type + "-" + fav.id} 
                  className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-600 transition-all"
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                    isDish 
                      ? 'bg-orange-100 dark:bg-orange-900/30' 
                      : 'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                    {isDish ? '🍽️' : '🏛️'}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={isDish ? "/dishes/" + fav.id : "/venues/" + fav.id}
                      className="group"
                    >
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors truncate">
                        {dish?.name || venue?.name}
                      </h3>
                    </Link>
                    {dish?.description && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 line-clamp-1">
                        {dish.description}
                      </p>
                    )}
                    {venue?.location && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {venue.location}
                      </p>
                    )}
                    {dish && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-md text-xs font-medium">
                          {dish.calories} cal
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium">
                          {dish.protein}g protein
                        </span>
                        {dish.dietary_tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-md text-xs font-medium capitalize">
                            {tag.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFavorite(fav.type, fav.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                    title="Remove from favorites"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
