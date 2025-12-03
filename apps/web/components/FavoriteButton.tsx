'use client';

import { useState, useEffect } from 'react';
import { showToastGlobal } from './ToastProvider';

interface FavoriteButtonProps {
  itemType: 'dish' | 'venue';
  itemId: number;
  itemName?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Helper to get favorites from localStorage
function getFavorites(): { dishes: number[]; venues: number[] } {
  if (typeof window === 'undefined') return { dishes: [], venues: [] };
  const stored = localStorage.getItem('favorites');
  return stored ? JSON.parse(stored) : { dishes: [], venues: [] };
}

// Helper to save favorites to localStorage
function saveFavorites(favorites: { dishes: number[]; venues: number[] }) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
  // Dispatch custom event so other components can react
  window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: favorites }));
}

export function FavoriteButton({ itemType, itemId, itemName, size = 'md' }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  useEffect(() => {
    // Check if item is favorited from localStorage
    const favorites = getFavorites();
    const key = itemType === 'dish' ? 'dishes' : 'venues';
    setIsFavorite(favorites[key].includes(itemId));

    // Listen for changes from other components
    const handleUpdate = () => {
      const updated = getFavorites();
      setIsFavorite(updated[key].includes(itemId));
    };
    window.addEventListener('favoritesUpdated', handleUpdate);
    return () => window.removeEventListener('favoritesUpdated', handleUpdate);
  }, [itemType, itemId]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favorites = getFavorites();
    const key = itemType === 'dish' ? 'dishes' : 'venues';
    
    if (isFavorite) {
      // Remove from favorites
      favorites[key] = favorites[key].filter((id: number) => id !== itemId);
    } else {
      // Add to favorites
      favorites[key].push(itemId);
    }
    
    saveFavorites(favorites);
    setIsFavorite(!isFavorite);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // Show toast notification
    const displayName = itemName || (itemType === 'dish' ? 'Dish' : 'Venue');
    if (!isFavorite) {
      showToastGlobal(`${displayName} added to favorites!`, 'success', '❤️');
    } else {
      showToastGlobal(`${displayName} removed from favorites`, 'info', '💔');
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      className={`p-2 rounded-full transition-all ${
        isFavorite 
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
          : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${isAnimating ? 'scale-125' : ''}`}
      style={{ transition: 'transform 0.2s ease-out' }}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg 
        className={sizeClasses[size]} 
        fill={isFavorite ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
    </button>
  );
}
