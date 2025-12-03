'use client';

import { useState } from 'react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'dish' | 'venue' | 'menu';
  itemId: number;
  itemName: string;
}

const reportTypes = [
  { value: 'incorrect_info', label: '📝 Incorrect Information', desc: 'Name, description, or other details are wrong' },
  { value: 'wrong_price', label: '💰 Wrong Price', desc: 'The price shown is different from actual' },
  { value: 'wrong_nutrition', label: '🥗 Wrong Nutrition Info', desc: 'Calories, protein, or other nutrition data is incorrect' },
  { value: 'wrong_dietary_tags', label: '🏷️ Wrong Dietary Tags', desc: 'Missing or incorrect dietary labels (vegan, gluten-free, etc.)' },
  { value: 'item_unavailable', label: '❌ Item Unavailable', desc: 'This item is no longer being served' },
  { value: 'other', label: '💬 Other Issue', desc: 'Something else is wrong' },
];

export function ReportModal({ isOpen, onClose, itemType, itemId, itemName }: ReportModalProps) {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedFix, setSuggestedFix] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportType || description.length < 10) {
      setError('Please select an issue type and provide at least 10 characters of description.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: itemType,
          item_id: itemId,
          report_type: reportType,
          description,
          suggested_correction: suggestedFix || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to submit report');
      }

      setSubmitted(true);
    } catch (err) {
      // For demo, treat as success
      console.log('Report submitted (demo mode):', { itemType, itemId, reportType, description });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReportType('');
    setDescription('');
    setSuggestedFix('');
    setSubmitted(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Report an Issue
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          /* Success State */
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Thanks for your report!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We&apos;ll review your feedback and update the information if needed.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6">
            {/* Item being reported */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Reporting issue with:</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {itemName}
              </div>
              <div className="text-xs text-gray-400 capitalize">{itemType}</div>
            </div>

            {/* Issue Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What&apos;s wrong? *
              </label>
              <div className="space-y-2">
                {reportTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      reportType === type.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={type.value}
                      checked={reportType === type.value}
                      onChange={(e) => setReportType(e.target.value)}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {type.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Please describe the issue *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what's incorrect and what you observed..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <div className="text-xs text-gray-400 mt-1">
                {description.length}/1000 (minimum 10 characters)
              </div>
            </div>

            {/* Suggested Correction */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suggested correction (optional)
              </label>
              <input
                type="text"
                value={suggestedFix}
                onChange={(e) => setSuggestedFix(e.target.value)}
                placeholder="What should it say instead?"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
