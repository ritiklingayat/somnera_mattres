import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../Account';
import { getProductReviewsApi, submitProductReviewApi } from '../../services/reviewService';
import './ProductReviews.css';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function ProductReviews({ productId, productName = 'Product', onStatsChange }) {
  const { user, isLoggedIn, showToast } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    reviewCount: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'highest' | 'lowest'

  const onStatsChangeRef = useRef(onStatsChange);
  useEffect(() => {
    onStatsChangeRef.current = onStatsChange;
  }, [onStatsChange]);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-fill reviewer name when user is logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      setUserName(fullName || user.email || '');
    } else {
      setUserName('');
    }
  }, [isLoggedIn, user]);

  // Fetch reviews whenever productId changes
  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      if (!productId) return;
      try {
        setLoading(true);
        const data = await getProductReviewsApi(productId);
        if (!cancelled && data) {
          const list = Array.isArray(data.reviews) ? data.reviews : [];
          setReviews(list);
          const newStats = {
            averageRating: data.averageRating || 0,
            reviewCount: data.reviewCount || list.length,
            ratingDistribution: data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          };
          setStats(newStats);
          if (onStatsChangeRef.current) {
            onStatsChangeRef.current(newStats);
          }
        }
      } catch (err) {
        console.error('Error loading product reviews:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedComment = comment.trim();
    if (!trimmedComment || trimmedComment.length < 3) {
      setErrorMsg('Please write at least 3 characters in your review comment.');
      return;
    }

    const finalName = (userName || '').trim() || (isLoggedIn ? 'Verified Buyer' : 'Guest Customer');
    if (!finalName) {
      setErrorMsg('Please enter your name.');
      return;
    }

    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a star rating between 1 and 5.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitProductReviewApi(productId, {
        rating,
        title: title.trim(),
        comment: trimmedComment,
        userName: finalName,
      });

      // Clear form
      setTitle('');
      setComment('');
      setRating(5);
      setErrorMsg('');

      const successText = 'Thank you! Your review has been published.';
      setSuccessMsg(successText);
      if (typeof showToast === 'function') {
        showToast(successText, 'success');
      }

      // Add to reviews list immediately and update stats
      if (res?.review) {
        setReviews((prev) => [res.review, ...prev]);
        const updatedStats = {
          averageRating: res.averageRating ?? stats.averageRating,
          reviewCount: res.reviewCount ?? (stats.reviewCount + 1),
          ratingDistribution: {
            ...stats.ratingDistribution,
            [res.review.rating]: (stats.ratingDistribution[res.review.rating] || 0) + 1,
          },
        };
        setStats(updatedStats);
        if (onStatsChangeRef.current) {
          onStatsChangeRef.current(updatedStats);
        }
      } else {
        // Fallback: re-fetch reviews
        const data = await getProductReviewsApi(productId);
        if (data) {
          const list = Array.isArray(data.reviews) ? data.reviews : [];
          setReviews(list);
          const updatedStats = {
            averageRating: data.averageRating || 0,
            reviewCount: data.reviewCount || list.length,
            ratingDistribution: data.ratingDistribution || stats.ratingDistribution,
          };
          setStats(updatedStats);
          if (onStatsChangeRef.current) onStatsChangeRef.current(updatedStats);
        }
      }

      // Automatically collapse form after short delay
      setTimeout(() => {
        setFormOpen(false);
        setSuccessMsg('');
      }, 3500);
    } catch (err) {
      console.error('Review submission error:', err);
      setErrorMsg(err.message || 'Unable to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (sortBy === 'highest') {
      list.sort((a, b) => b.rating - a.rating || new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'lowest') {
      list.sort((a, b) => a.rating - b.rating || new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [reviews, sortBy]);

  const activeStar = hoverRating || rating;

  return (
    <section className="product-reviews-section" id="customer-reviews" aria-label="Customer Reviews">
      <div className="product-reviews-header">
        <div>
          <span className="reviews-eyebrow">Customer Feedback</span>
          <h2 className="reviews-title">Reviews & Ratings</h2>
          <p className="reviews-subtitle">
            Authentic experiences from verified sleepers and customers.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary write-review-toggle-btn"
          onClick={() => {
            setFormOpen((prev) => !prev);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          aria-expanded={formOpen}
        >
          {formOpen ? 'Close Form' : 'Write a Review'}
        </button>
      </div>

      {/* Snapshot / Summary Bar */}
      <div className="reviews-summary-card">
        <div className="summary-score-col">
          <div className="big-rating-number">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}</div>
          <div className="summary-stars" aria-label={`Rated ${stats.averageRating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= Math.round(stats.averageRating) ? 'star-filled' : 'star-empty'}
              >
                ★
              </span>
            ))}
          </div>
          <div className="summary-count">
            {stats.reviewCount > 0
              ? `Based on ${stats.reviewCount} ${stats.reviewCount === 1 ? 'review' : 'reviews'}`
              : 'No reviews yet'}
          </div>
        </div>

        <div className="summary-bars-col">
          {[5, 4, 3, 2, 1].map((starLevel) => {
            const count = stats.ratingDistribution?.[starLevel] || 0;
            const pct = stats.reviewCount > 0 ? Math.round((count / stats.reviewCount) * 100) : 0;
            return (
              <div key={starLevel} className="rating-bar-row">
                <span className="bar-label">{starLevel} ★</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
                <span className="bar-count">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write a Review Collapsible Form */}
      {formOpen && (
        <div className="review-form-card" aria-live="polite">
          <h3 className="review-form-title">Write a Review for {productName}</h3>
          <p className="review-form-note">
            Your feedback helps other customers choose the perfect comfort for their home.
          </p>

          {errorMsg && <div className="review-form-alert alert-error">{errorMsg}</div>}
          {successMsg && <div className="review-form-alert alert-success">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="review-form">
            {/* Star Rating Picker */}
            <div className="form-group">
              <label className="form-label">
                Overall Rating <span className="req">*</span>
              </label>
              <div className="interactive-stars-picker" role="radiogroup" aria-label="Select rating 1 to 5 stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-pick-btn ${star <= activeStar ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    aria-checked={rating === star}
                    role="radio"
                  >
                    ★
                  </button>
                ))}
                <span className="rating-sentiment-label">
                  {RATING_LABELS[activeStar] || 'Select your rating'}
                </span>
              </div>
            </div>

            {/* Reviewer Name */}
            <div className="form-group">
              <label htmlFor="review-author-name" className="form-label">
                Your Name <span className="req">*</span>
              </label>
              <input
                id="review-author-name"
                type="text"
                className="review-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Aditi Sharma"
                required
              />
              {isLoggedIn ? (
                <small className="form-hint logged-in-hint">
                  ✓ Signed in as {user?.firstName || 'Somnera Member'} ({user?.email})
                </small>
              ) : (
                <small className="form-hint">
                  Posting as a guest. (You can also sign in to earn loyalty perks!)
                </small>
              )}
            </div>

            {/* Review Title */}
            <div className="form-group">
              <label htmlFor="review-title" className="form-label">
                Review Headline <span className="optional">(Optional)</span>
              </label>
              <input
                id="review-title"
                type="text"
                className="review-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Best sleep quality in years, superb spinal support!"
                maxLength={120}
              />
            </div>

            {/* Review Comment */}
            <div className="form-group">
              <label htmlFor="review-comment" className="form-label">
                Your Review <span className="req">*</span>
              </label>
              <textarea
                id="review-comment"
                className="review-textarea"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you love about this product? Tell us about firmness, comfort, durability, and delivery experience..."
                required
              />
            </div>

            <div className="review-form-actions">
              <button
                type="submit"
                className="button button-primary submit-review-btn"
                disabled={submitting}
              >
                {submitting ? 'Submitting Review...' : 'Submit Review'}
              </button>
              <button
                type="button"
                className="button review-cancel-btn"
                onClick={() => setFormOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List Header & Sort */}
      <div className="reviews-list-controls">
        <h3 className="all-reviews-heading">
          All Reviews ({reviews.length})
        </h3>

        {reviews.length > 1 && (
          <div className="reviews-sort-wrap">
            <label htmlFor="reviews-sort" className="sort-label">
              Sort by:
            </label>
            <select
              id="reviews-sort"
              className="reviews-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="reviews-loading-state">
          <div className="spinner" />
          <p>Loading customer reviews...</p>
        </div>
      ) : sortedReviews.length === 0 ? (
        <div className="reviews-empty-state">
          <div className="empty-stars-icon">★★★★★</div>
          <h4>No Reviews Recorded Yet</h4>
          <p>
            Be the first to share your experience with this product. All submitted reviews are publicly visible to
            visitors!
          </p>
          {!formOpen && (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setFormOpen(true)}
            >
              Write the First Review
            </button>
          )}
        </div>
      ) : (
        <div className="reviews-cards-list">
          {sortedReviews.map((rev) => (
            <article key={rev.id || `${rev.userName}-${rev.createdAt}`} className="review-card">
              <div className="review-card-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {(rev.userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="reviewer-name-row">
                      <strong className="reviewer-name">{rev.userName || 'Customer'}</strong>
                      {rev.isVerified && (
                        <span className="verified-badge" title="Verified Customer">
                          ✓ Verified Buyer
                        </span>
                      )}
                    </div>
                    <time className="review-date" dateTime={rev.createdAt}>
                      {rev.createdAt
                        ? new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Recent'}
                    </time>
                  </div>
                </div>

                <div className="review-stars-badge" aria-label={`${rev.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= rev.rating ? 'star-filled' : 'star-empty'}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {rev.title && <h4 className="review-card-title">{rev.title}</h4>}
              <p className="review-card-comment">{rev.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
