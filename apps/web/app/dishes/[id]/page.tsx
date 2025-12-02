'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ReportModal } from '@/components/ReportModal';
import { FavoriteButton } from '@/components/FavoriteButton';
import { dishes as demoDishes, type Dish as DemoDish } from '@/lib/demoData';

interface Review {
  id: number;
  rating: number;
  comment?: string;
  created_at: string;
  user_id: number;
  user_name?: string;
  photos?: string[];
}

interface DishWithReviews extends DemoDish {
  reviews?: Review[];
}

export default function DishDetailPage() {
  const params = useParams();
  const [dish, setDish] = useState<DishWithReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dishId = Number(params.id);
    
    // Find the dish from demo data by ID (always use demo for rich nutrition data)
    const demoDish = demoDishes.find((d: DemoDish) => d.dish_id === dishId);
    
    if (demoDish) {
      // Load any saved reviews from localStorage
      const savedReviews = JSON.parse(localStorage.getItem(`reviews_${dishId}`) || '[]');
      
      // Default demo reviews
      const demoReviews: Review[] = [
        { id: 1, rating: 5, comment: `Love the ${demoDish.name}! Always fresh and delicious.`, created_at: '2024-12-01', user_id: 1, user_name: 'Alex M.', photos: [] },
        { id: 2, rating: 4, comment: 'Great option, will definitely get again.', created_at: '2024-11-28', user_id: 2, user_name: 'Jordan K.', photos: [] },
      ];
      
      // User reviews first, then demo reviews
      setDish({
        ...demoDish,
        reviews: [...savedReviews, ...demoReviews]
      });
    } else {
      // Fallback for unknown dish ID
      setDish(null);
    }
    setLoading(false);
  }, [params.id]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files).slice(0, 4 - reviewPhotos.length); // Max 4 photos
    setReviewPhotos(prev => [...prev, ...newFiles]);
    
    // Create preview URLs
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotoPreviewUrls(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setReviewPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dish) return;
    
    setSubmittingReview(true);
    
    // Create the new review
    const newReview: Review = {
      id: Date.now(),
      rating: reviewRating,
      comment: reviewComment,
      created_at: new Date().toISOString().split('T')[0],
      user_id: 1,
      user_name: 'You',
      photos: photoPreviewUrls
    };
    
    try {
      // Try to submit to backend
      const formData = new FormData();
      formData.append('dish_id', dish.dish_id.toString());
      formData.append('rating', reviewRating.toString());
      if (reviewComment) formData.append('text_review', reviewComment);
      
      // Add photos
      reviewPhotos.forEach((photo) => {
        formData.append('photos', photo);
      });
      
      const res = await fetch('http://localhost:8000/api/v1/reviews', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Failed to submit');
      
    } catch {
      // Demo mode - save to localStorage
      const savedReviews = JSON.parse(localStorage.getItem(`reviews_${dish.dish_id}`) || '[]');
      savedReviews.unshift(newReview);
      localStorage.setItem(`reviews_${dish.dish_id}`, JSON.stringify(savedReviews));
      
      // Also save to user's review history for the reviews page
      const userReviews = JSON.parse(localStorage.getItem('userReviews') || '[]');
      userReviews.unshift({
        review_id: newReview.id,
        dish_id: dish.dish_id,
        dish_name: dish.name,
        rating: newReview.rating,
        comment: newReview.comment,
        created_at: newReview.created_at,
        photos: newReview.photos
      });
      localStorage.setItem('userReviews', JSON.stringify(userReviews));
    }
    
    // Add to local state
    setDish({
      ...dish,
      reviews: [newReview, ...(dish.reviews || [])]
    });
    
    setSubmittingReview(false);
    setReviewSuccess(true);
    setShowReviewForm(false);
    setReviewComment('');
    setReviewRating(5);
    setReviewPhotos([]);
    setPhotoPreviewUrls([]);
    
    // Hide success message after 3 seconds
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dish not found</h1>
          <Link href="/dishes" className="text-emerald-600 hover:underline mt-4 inline-block">
            ← Back to menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dishes" className="text-emerald-600 dark:text-emerald-400 hover:underline mb-6 inline-block">
          ← Back to menu
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{dish.name}</h1>
                {dish.avg_rating && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold text-yellow-700 dark:text-yellow-300">{dish.avg_rating}</span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">({dish.review_count} reviews)</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FavoriteButton itemType="dish" itemId={dish.dish_id} />
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                  title="Report an issue"
                >
                  🚩
                </button>
              </div>
            </div>
            {dish.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-4">{dish.description}</p>
            )}
            
            {/* Dietary Tags & Pork Indicator */}
            <div className="mt-4 space-y-3">
              {dish.contains_pork && (
                <div className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/30 px-3 py-1 rounded-full">
                  <span className="text-pink-600">🐷</span>
                  <span className="text-sm text-pink-700 dark:text-pink-300 font-medium">Contains Pork</span>
                </div>
              )}
              {dish.dietary_tags && dish.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dish.dietary_tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm capitalize">
                      {tag.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nutrition Facts - FDA Style */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="bg-white dark:bg-gray-900 border-4 border-black dark:border-gray-600 p-4 max-w-sm">
              <h2 className="text-2xl font-black border-b-8 border-black dark:border-gray-600 pb-1 mb-2">Nutrition Facts</h2>
              {dish.serving_size && (
                <p className="text-sm border-b border-gray-300 dark:border-gray-600 pb-2 mb-2">
                  <span className="font-bold">Serving Size</span> {dish.serving_size}
                </p>
              )}
              
              <div className="border-b-8 border-black dark:border-gray-600 pb-2 mb-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-lg">Calories</span>
                  <span className="text-3xl font-black">{dish.calories || 0}</span>
                </div>
              </div>
              
              <div className="text-right text-sm font-bold border-b border-gray-300 dark:border-gray-600 pb-1 mb-1">% Daily Value*</div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                  <span><span className="font-bold">Total Fat</span> {dish.fat || 0}g</span>
                  <span className="font-bold">{Math.round(((dish.fat || 0) / 78) * 100)}%</span>
                </div>
                {dish.saturated_fat !== undefined && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1 pl-4">
                    <span>Saturated Fat {dish.saturated_fat}g</span>
                    <span className="font-bold">{Math.round((dish.saturated_fat / 20) * 100)}%</span>
                  </div>
                )}
                {dish.trans_fat !== undefined && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1 pl-4">
                    <span>Trans Fat {dish.trans_fat}g</span>
                  </div>
                )}
                {dish.cholesterol !== undefined && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                    <span><span className="font-bold">Cholesterol</span> {dish.cholesterol}mg</span>
                    <span className="font-bold">{Math.round((dish.cholesterol / 300) * 100)}%</span>
                  </div>
                )}
                {dish.sodium !== undefined && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                    <span><span className="font-bold">Sodium</span> {dish.sodium}mg</span>
                    <span className="font-bold">{Math.round((dish.sodium / 2300) * 100)}%</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                  <span><span className="font-bold">Total Carbohydrate</span> {dish.carbs || 0}g</span>
                  <span className="font-bold">{Math.round(((dish.carbs || 0) / 275) * 100)}%</span>
                </div>
                {dish.fiber !== undefined && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1 pl-4">
                    <span>Dietary Fiber {dish.fiber}g</span>
                    <span className="font-bold">{Math.round((dish.fiber / 28) * 100)}%</span>
                  </div>
                )}
                {dish.sugar !== undefined && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1 pl-4">
                    <span>Total Sugars {dish.sugar}g</span>
                  </div>
                )}
                <div className="flex justify-between border-b-4 border-black dark:border-gray-600 pb-2 pt-1">
                  <span><span className="font-bold">Protein</span> {dish.protein || 0}g</span>
                </div>
              </div>
              
              <p className="text-xs mt-2 text-gray-500">* Percent Daily Values are based on a 2,000 calorie diet.</p>
            </div>
          </div>

          {/* Ingredients */}
          {dish.ingredients && (
            <div className="p-8 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">📝 Ingredients</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{dish.ingredients}</p>
            </div>
          )}

          {/* Allergens */}
          {dish.allergens && dish.allergens.length > 0 && (
            <div className="p-8 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">⚠️ Allergens</h2>
              <div className="flex flex-wrap gap-2">
                {dish.allergens.map((allergen) => (
                  <span key={allergen} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm capitalize font-medium">
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reviews</h2>
              {!showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  ✏️ Write a Review
                </button>
              )}
            </div>

            {/* Success Message */}
            {reviewSuccess && (
              <div className="mb-4 p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg flex items-center gap-2">
                ✅ Your review has been submitted! Thank you for your feedback.
              </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Write Your Review</h3>
                <form onSubmit={handleSubmitReview}>
                  {/* Star Rating */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-3xl transition-transform hover:scale-110"
                        >
                          <span className={star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}>
                            ★
                          </span>
                        </button>
                      ))}
                      <span className="ml-2 text-gray-600 dark:text-gray-400 self-center">
                        {reviewRating === 5 ? 'Excellent!' : reviewRating === 4 ? 'Good' : reviewRating === 3 ? 'Average' : reviewRating === 2 ? 'Below Average' : 'Poor'}
                      </span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Review (optional)
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this dish..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📸 Add Photos (optional, max 4)
                    </label>
                    
                    {/* Photo Previews */}
                    {photoPreviewUrls.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-3">
                        {photoPreviewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                              <Image
                                src={url}
                                alt={`Preview ${index + 1}`}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-colors shadow-md"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    {reviewPhotos.length < 4 && (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2"
                        >
                          <span className="text-xl">📷</span>
                          <span>Add photos of your dish</span>
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          Upload up to {4 - reviewPhotos.length} more photo{4 - reviewPhotos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {submittingReview ? (
                        <>
                          <span className="animate-spin">⏳</span> Submitting...
                        </>
                      ) : (
                        <>Submit Review</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewComment('');
                        setReviewRating(5);
                        setReviewPhotos([]);
                        setPhotoPreviewUrls([]);
                      }}
                      className="px-6 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {dish.reviews && dish.reviews.length > 0 ? (
              <div className="space-y-4">
                {dish.reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                          {(review.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {review.user_name || 'Anonymous'}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{review.created_at}</span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 dark:text-gray-300 ml-10 mb-3">{review.comment}</p>
                    )}
                    {/* Review Photos */}
                    {review.photos && review.photos.length > 0 && (
                      <div className="flex flex-wrap gap-2 ml-10 mt-2">
                        {review.photos.map((photo, index) => (
                          <div key={index} className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <Image
                              src={photo}
                              alt={`Review photo ${index + 1}`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        itemType="dish"
        itemId={dish.dish_id}
        itemName={dish.name}
      />
    </div>
  );
}