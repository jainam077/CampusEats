'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Review {
  review_id: number;
  dish_id: number;
  dish_name?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

const demoReviews: Review[] = [
  { review_id: 1, dish_id: 1, dish_name: 'Grilled Chicken Bowl', rating: 5, comment: 'Amazing! Perfect portion and great flavor.', created_at: '2024-12-01T12:30:00Z' },
  { review_id: 2, dish_id: 5, dish_name: 'Buddha Bowl', rating: 4, comment: 'Love the variety of veggies. Could use more sauce.', created_at: '2024-11-28T18:15:00Z' },
  { review_id: 3, dish_id: 3, dish_name: 'Caesar Salad', rating: 3, comment: 'Pretty standard, nothing special.', created_at: '2024-11-25T13:00:00Z' },
  { review_id: 4, dish_id: 8, dish_name: 'Impossible Burger', rating: 5, comment: 'Best plant-based burger on campus!', created_at: '2024-11-20T19:45:00Z' },
  { review_id: 5, dish_id: 4, dish_name: 'Pepperoni Pizza', rating: 4, comment: 'Classic comfort food. Always reliable.', created_at: '2024-11-15T12:00:00Z' },
];

function StarRating({ rating, interactive = false, onRate, size = 'md' }: { rating: number; interactive?: boolean; onRate?: (r: number) => void; size?: 'sm' | 'md' | 'lg' }) {
  const [hovered, setHovered] = useState(0);
  const sizeClasses = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate?.(star)}
          className={`${sizeClasses[size]} transition-all duration-200 ${
            star <= (hovered || rating) ? 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]' : 'text-gray-300 dark:text-gray-600'
          } ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReviewHistoryPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'low'>('all');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    // Load user reviews from localStorage first, then add demo reviews
    const savedUserReviews = JSON.parse(localStorage.getItem('userReviews') || '[]');
    // Combine user reviews (first) with demo reviews
    setReviews([...savedUserReviews, ...demoReviews]);
    setLoading(false);
  }, []);

  const filteredReviews = reviews.filter(review => {
    if (filter === 'high') return review.rating >= 4;
    if (filter === 'low') return review.rating <= 2;
    return true;
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || '');
  };

  const handleEditSave = async () => {
    if (!editingReview) return;

    try {
      // Try to update on backend
      await fetch(`http://localhost:8000/api/v1/reviews/${editingReview.review_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: editRating, comment: editComment }),
      });
    } catch {
      // Update localStorage in demo mode
      const savedUserReviews = JSON.parse(localStorage.getItem('userReviews') || '[]');
      const updatedUserReviews = savedUserReviews.map((r: Review) => 
        r.review_id === editingReview.review_id 
          ? { ...r, rating: editRating, comment: editComment }
          : r
      );
      localStorage.setItem('userReviews', JSON.stringify(updatedUserReviews));
    }

    // Update local state
    setReviews(reviews.map(r => 
      r.review_id === editingReview.review_id 
        ? { ...r, rating: editRating, comment: editComment }
        : r
    ));
    setEditingReview(null);
  };

  const handleDelete = async (reviewId: number) => {
    try {
      // Try to delete on backend
      await fetch(`http://localhost:8000/api/v1/reviews/${reviewId}`, {
        method: 'DELETE',
      });
    } catch {
      // Remove from localStorage in demo mode
      const savedUserReviews = JSON.parse(localStorage.getItem('userReviews') || '[]');
      const updatedUserReviews = savedUserReviews.filter((r: Review) => r.review_id !== reviewId);
      localStorage.setItem('userReviews', JSON.stringify(updatedUserReviews));
    }

    // Remove from local state
    setReviews(reviews.filter(r => r.review_id !== reviewId));
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Reviews
            </h1>
            <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-lg">
              {reviews.length} reviews
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Your dining feedback history and ratings</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {reviews.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-3xl font-bold text-amber-500">{averageRating}</span>
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 text-center">
            <div className="text-3xl font-bold text-green-500 mb-1">
              {reviews.filter(r => r.rating === 5).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">5-Star</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
            }`}
          >
            All ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'high'
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
            }`}
          >
            4-5 Stars
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'low'
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
            }`}
          >
            1-2 Stars
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 rounded-full border-3 border-orange-200 border-t-orange-500 animate-spin"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 text-center py-16">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filter === 'all' ? 'No reviews yet' : 'No matching reviews'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm max-w-sm mx-auto">
              {filter === 'all' 
                ? "Start reviewing dishes to build your history!"
                : "Try a different filter to see more reviews"}
            </p>
            {filter === 'all' && (
              <Link
                href="/dishes"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Browse Dishes
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <div
                key={review.review_id}
                className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-zinc-600 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/dishes/${review.dish_id}`}
                      className="group"
                    >
                      <span className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors">
                        {review.dish_name || `Dish #${review.dish_id}`}
                      </span>
                    </Link>
                    <div className="flex items-center gap-3 mt-1.5">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(review)}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                      title="Edit review"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(review.review_id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      title="Delete review"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {review.comment && (
                  <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-700/50 border-l-3 border-orange-400">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  </div>
                )}

                {/* Delete Confirmation Inline */}
                {deleteConfirm === review.review_id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-2 font-medium">
                      Delete this review?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(review.review_id)}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 w-full max-w-md p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
                Edit Review
              </h3>
              
              {/* Star Rating */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating
                </label>
                <StarRating 
                  rating={editRating} 
                  interactive 
                  onRate={setEditRating}
                  size="lg"
                />
              </div>

              {/* Comment */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment
                </label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
                  placeholder="Share your thoughts about this dish..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleEditSave}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingReview(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
