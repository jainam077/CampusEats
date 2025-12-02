'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { FavoriteButton } from '@/components/FavoriteButton';
import { VoiceSearchButton } from '@/components/VoiceSearchButton';
import { dishes as allDemoDishes, venues, type Dish } from '@/lib/demoData';

// All Nutrislice filter options
const ALLERGENS = ['milk', 'eggs', 'wheat', 'soy', 'peanuts', 'tree nuts', 'fish', 'shellfish', 'sesame'];
const DIETARY_FILTERS = [
  { id: 'vegetarian', label: '🥬 Vegetarian', color: 'emerald' },
  { id: 'vegan', label: '🌱 Vegan', color: 'green' },
  { id: 'gluten-free', label: '🌾 Gluten Free', color: 'amber' },
  { id: 'halal', label: '☪️ Halal', color: 'blue' },
  { id: 'kosher', label: '✡️ Kosher', color: 'purple' },
  { id: 'dairy-free', label: '🥛 Dairy Free', color: 'pink' },
  { id: 'nut-free', label: '🥜 Nut Free', color: 'orange' },
  { id: 'high-protein', label: '💪 High Protein', color: 'cyan' },
  { id: 'low-carb', label: '🍞 Low Carb', color: 'rose' },
  { id: 'low-sodium', label: '🧂 Low Sodium', color: 'indigo' },
  { id: 'keto', label: '🥑 Keto', color: 'lime' },
  { id: 'paleo', label: '🦴 Paleo', color: 'stone' },
];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

function DishesContent() {
  const searchParams = useSearchParams();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [excludePork, setExcludePork] = useState(false);
  const [mealType, setMealType] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [aiSearchActive, setAiSearchActive] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);

  // AI-powered natural language search
  const performAiSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAiSearchActive(false);
      return;
    }

    setAiSearching(true);
    setAiSearchActive(true);
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/recommendations/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        setDishes(data.results);
      } else {
        setDishes([]);
      }
    } catch {
      // Fallback to client-side keyword search on demo data
      const keywords = query.toLowerCase().split(' ');
      const matches = allDemoDishes.filter((dish: Dish) => {
        const text = `${dish.name} ${dish.description || ''} ${(dish.dietary_tags || []).join(' ')}`.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });
      setDishes(matches.length > 0 ? matches : allDemoDishes);
    } finally {
      setAiSearching(false);
    }
  }, []);

  // Handle voice search result
  const handleVoiceResult = useCallback((transcript: string) => {
    setSearch(transcript);
    performAiSearch(transcript);
  }, [performAiSearch]);

  useEffect(() => {
    // Always use demo data for rich nutrition info - API data lacks this
    setDishes(allDemoDishes);
    setLoading(false);
    
    // Check for URL search param
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setSearch(urlQuery);
      performAiSearch(urlQuery);
    }
  }, [searchParams, performAiSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      performAiSearch(search);
    }
  };

  const clearSearch = () => {
    setSearch('');
    setAiSearchActive(false);
    setDishes(allDemoDishes);
  };

  const toggleDietary = (id: string) => {
    setSelectedDietary(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]
    );
  };

  const clearFilters = () => {
    setSelectedDietary([]);
    setSelectedAllergens([]);
    setExcludePork(false);
    setMealType('');
    setVenueFilter('');
  };

  // Apply all filters
  const filteredDishes = dishes.filter((dish: Dish) => {
    // Text search (if not AI searching)
    if (!aiSearchActive && search) {
      const searchText = `${dish.name} ${dish.description}`.toLowerCase();
      if (!searchText.includes(search.toLowerCase())) return false;
    }

    // Dietary filters
    if (selectedDietary.length > 0) {
      const hasDietary = selectedDietary.every(tag => 
        dish.dietary_tags?.includes(tag)
      );
      if (!hasDietary) return false;
    }

    // Allergen exclusions - exclude dishes that contain selected allergens
    if (selectedAllergens.length > 0) {
      const hasAllergen = selectedAllergens.some(allergen =>
        dish.allergens?.some(a => a.toLowerCase() === allergen.toLowerCase())
      );
      if (hasAllergen) return false;
    }

    // Pork exclusion
    if (excludePork && dish.contains_pork) return false;

    // Meal type filter
    if (mealType && dish.meal_type !== mealType) return false;

    // Venue filter
    if (venueFilter && dish.venue_id !== Number(venueFilter)) return false;

    return true;
  });

  const activeFiltersCount = selectedDietary.length + selectedAllergens.length + (excludePork ? 1 : 0) + (mealType ? 1 : 0) + (venueFilter ? 1 : 0);

  return (
    <div className="min-h-screen mesh-gradient py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Browse Menu
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{allDemoDishes.length} items available</p>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Try: 'high protein breakfast' or 'spicy vegetarian'..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-14 py-3.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <VoiceSearchButton onResult={handleVoiceResult} />
              </div>
            </div>
            <button
              type="submit"
              disabled={aiSearching}
              className="px-6 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {aiSearching ? (
                <>
                  <span className="animate-spin">⚡</span> Searching...
                </>
              ) : (
                <>✨ AI Search</>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-white border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </form>
          
          {aiSearchActive && (
            <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-xl inline-flex">
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                ✨ AI results for &quot;{search}&quot;
              </span>
              <button
                onClick={clearSearch}
                className="text-purple-500 hover:text-purple-700 font-medium ml-2"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filter Options</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Venue & Meal Type */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dining Hall</label>
                <select
                  value={venueFilter}
                  onChange={(e) => setVenueFilter(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-0 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Locations</option>
                  {venues.map(v => (
                    <option key={v.venue_id} value={v.venue_id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Meal Type</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-0 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Meals</option>
                  {MEAL_TYPES.map(m => (
                    <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dietary Preferences</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_FILTERS.map(diet => (
                  <button
                    key={diet.id}
                    onClick={() => toggleDietary(diet.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedDietary.includes(diet.id)
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {diet.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pork Indicator */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludePork}
                  onChange={(e) => setExcludePork(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  🐷 Exclude items containing pork
                </span>
              </label>
            </div>

            {/* Allergen Exclusions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                ⚠️ Exclude Allergens (hide items containing these)
              </label>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map(allergen => (
                  <button
                    key={allergen}
                    onClick={() => toggleAllergen(allergen)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                      selectedAllergens.includes(allergen)
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40'
                    }`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
          Showing {filteredDishes.length} of {dishes.length} items
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDishes.map((dish: Dish) => (
              <div key={dish.dish_id} className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-zinc-600 transition-all duration-200 group">
                <Link href={`/dishes/${dish.dish_id}`} className="block p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 rounded-md capitalize font-medium">
                          {dish.meal_type}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{dish.venue_name}</span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors pr-8">
                        {dish.name}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {dish.contains_pork && <span title="Contains Pork" className="text-sm">🐷</span>}
                      <FavoriteButton itemType="dish" itemId={dish.dish_id} size="sm" />
                    </div>
                  </div>

                  {/* Description */}
                  {dish.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {dish.description}
                    </p>
                  )}
                  
                  {/* Nutrition Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2 py-1 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-md text-xs font-medium">
                      {dish.calories} cal
                    </span>
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium">
                      {dish.protein}g protein
                    </span>
                    <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-md text-xs font-medium">
                      {dish.carbs}g carbs
                    </span>
                  </div>

                  {/* Dietary Tags */}
                  {dish.dietary_tags && dish.dietary_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {dish.dietary_tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-md text-xs font-medium capitalize">
                          {tag.replace(/-/g, ' ')}
                        </span>
                      ))}
                      {dish.dietary_tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{dish.dietary_tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Allergens Warning */}
                  {dish.allergens && dish.allergens.length > 0 && (
                    <div className="text-xs text-red-500 dark:text-red-400 mb-3">
                      ⚠️ {dish.allergens.slice(0, 3).join(', ')}{dish.allergens.length > 3 ? ` +${dish.allergens.length - 3}` : ''}
                    </div>
                  )}

                  {/* Rating Footer */}
                  {dish.avg_rating > 0 && (
                    <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100 dark:border-zinc-700">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${star <= Math.round(dish.avg_rating) ? 'text-orange-400' : 'text-gray-200 dark:text-zinc-600'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{dish.avg_rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-400">({dish.review_count})</span>
                    </div>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}

        {filteredDishes.length === 0 && !loading && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No dishes match your filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-orange-500 hover:text-orange-600 font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DishesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen mesh-gradient py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    }>
      <DishesContent />
    </Suspense>
  );
}