import { useEffect, useMemo, useState } from 'react';
import { getAdminReviewsApi, deleteAdminReviewApi } from '../services/adminService';
import AdminModal from '../components/AdminModal';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  // Deletion Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Expand replies
  const [expandedReviewIds, setExpandedReviewIds] = useState(new Set());

  const toggleRepliesExpand = (reviewId) => {
    setExpandedReviewIds((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminReviewsApi();
      const list = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];
      setReviews(list);
    } catch (err) {
      setError(err.message || 'Unable to load customer reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // Compute unique products from reviews for filter dropdown
  const uniqueProducts = useMemo(() => {
    const map = new Map();
    reviews.forEach((r) => {
      if (r.product?.id && !map.has(r.product.id)) {
        map.set(r.product.id, r.product.name || 'Unnamed Product');
      } else if (r.productId && !map.has(r.productId)) {
        map.set(r.productId, r.productName || r.productId);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reviews]);

  // Overall platform review metrics
  const metrics = useMemo(() => {
    const total = reviews.length;
    const avg =
      total > 0
        ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / total).toFixed(1)
        : '0.0';
    const fiveStar = reviews.filter((r) => Number(r.rating) === 5).length;
    const totalReplies = reviews.reduce((acc, r) => acc + (r.replies?.length || 0), 0);
    return { total, avg, fiveStar, totalReplies };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Rating filter
      if (ratingFilter && String(r.rating) !== String(ratingFilter)) {
        return false;
      }

      // Product filter
      if (productFilter && r.productId !== productFilter && r.product?.id !== productFilter) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const searchable = [
          r.userName,
          r.userEmail,
          r.title,
          r.comment,
          r.product?.name,
          r.product?.slug,
          r.productId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchable.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [reviews, searchQuery, ratingFilter, productFilter]);

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setDeleteError('');
      await deleteAdminReviewApi(deleteTarget.id);

      // Remove from list
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message || 'Unable to delete review. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="admin-title">
        <div>
          <p>Moderation & Customer Feedback</p>
          <h1>Customer Reviews</h1>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            type="button"
            className="admin-print-btn"
            onClick={loadReviews}
            disabled={loading}
            title="Refresh Reviews"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--admin-line)',
            borderRadius: '12px',
            padding: '18px 22px',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Reviews
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#241132', marginTop: '4px' }}>
            {metrics.total}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--admin-line)',
            borderRadius: '12px',
            padding: '18px 22px',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
            Platform Avg Rating
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
            ★ {metrics.avg}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--admin-line)',
            borderRadius: '12px',
            padding: '18px 22px',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
            5-Star Reviews
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
            {metrics.fiveStar}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid var(--admin-line)',
            borderRadius: '12px',
            padding: '18px 22px',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Replies
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#241132', marginTop: '4px' }}>
            {metrics.totalReplies}
          </div>
        </div>
      </div>

      <section className="admin-card">
        {/* Search & Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--admin-line)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, email, product, or review text..."
              style={{
                minWidth: '260px',
                flex: '1 1 260px',
                padding: '9px 14px',
                border: '1px solid var(--admin-line)',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}
            />

            {/* Rating Filter Dropdown */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                border: '1px solid var(--admin-line)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#241132',
                fontWeight: 600,
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="">All Ratings</option>
              <option value="5">★ 5 Stars Only</option>
              <option value="4">★ 4 Stars Only</option>
              <option value="3">★ 3 Stars Only</option>
              <option value="2">★ 2 Stars Only</option>
              <option value="1">★ 1 Star Only</option>
            </select>

            {/* Product Filter Dropdown */}
            {uniqueProducts.length > 0 && (
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                style={{
                  padding: '9px 12px',
                  border: '1px solid var(--admin-line)',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: '#241132',
                  fontWeight: 600,
                  background: '#fff',
                  cursor: 'pointer',
                  maxWidth: '240px',
                }}
              >
                <option value="">All Products</option>
                {uniqueProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {(searchQuery || ratingFilter || productFilter) && (
              <button
                type="button"
                className="admin-print-btn"
                onClick={() => {
                  setSearchQuery('');
                  setRatingFilter('');
                  setProductFilter('');
                }}
                style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>
            Showing {filteredReviews.length} of {reviews.length} reviews
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
            Loading platform reviews...
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
            <h3>Error loading reviews</h3>
            <p>{error}</p>
            <button type="button" className="admin-print-btn" onClick={loadReviews} style={{ marginTop: '12px' }}>
              Retry
            </button>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px', color: '#d1d5db' }}>★</div>
            <h3 style={{ color: '#1f142c', margin: '0 0 6px' }}>No reviews found</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {reviews.length === 0
                ? 'No customer reviews have been submitted yet.'
                : 'No reviews match your selected filters.'}
            </p>
          </div>
        ) : (
          <div className="order-table" style={{ overflowX: 'auto' }}>
            <div
              className="table-head"
              style={{
                gridTemplateColumns: '1.2fr 1.2fr 0.8fr 2fr 1fr 0.8fr',
                minWidth: '950px',
              }}
            >
              <span>Product</span>
              <span>Customer</span>
              <span>Rating</span>
              <span>Review & Replies</span>
              <span>Date Submitted</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {filteredReviews.map((rev) => {
              const hasReplies = rev.replies && rev.replies.length > 0;
              const isExpanded = expandedReviewIds.has(rev.id);

              return (
                <div
                  key={rev.id}
                  style={{
                    borderBottom: '1px solid var(--admin-line)',
                    background: '#fff',
                  }}
                >
                  <div
                    className="table-row"
                    style={{
                      gridTemplateColumns: '1.2fr 1.2fr 0.8fr 2fr 1fr 0.8fr',
                      minWidth: '950px',
                      alignItems: 'start',
                      padding: '16px 12px',
                    }}
                  >
                    {/* Product Column */}
                    <div>
                      <b style={{ color: '#1f142c', display: 'block', fontSize: '0.88rem' }}>
                        {rev.product?.name || 'Product'}
                      </b>
                      <small style={{ color: '#6b7280', fontSize: '0.74rem' }}>
                        ID: {rev.productId || rev.product?.id || '—'}
                      </small>
                    </div>

                    {/* Customer Column */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b style={{ color: '#1f142c', fontSize: '0.88rem' }}>{rev.userName || 'Customer'}</b>
                        {rev.isVerified && (
                          <span
                            style={{
                              background: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '999px',
                            }}
                            title="Verified Purchase/User"
                          >
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <small style={{ color: '#6b7280', display: 'block', marginTop: '2px', fontSize: '0.76rem' }}>
                        {rev.userEmail || (rev.userId ? `User ID: ${rev.userId}` : 'Guest')}
                      </small>
                    </div>

                    {/* Rating Column */}
                    <div>
                      <div style={{ color: '#f59e0b', fontSize: '0.95rem', letterSpacing: '1px' }}>
                        {'★'.repeat(Math.min(5, Math.max(1, rev.rating)))}
                        {'☆'.repeat(Math.max(0, 5 - Math.min(5, Math.max(1, rev.rating))))}
                      </div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#4b5563' }}>
                        {rev.rating}.0 / 5
                      </span>
                    </div>

                    {/* Review Comment Column */}
                    <div>
                      {rev.title && (
                        <div style={{ fontWeight: 700, color: '#1f142c', fontSize: '0.86rem', marginBottom: '3px' }}>
                          {rev.title}
                        </div>
                      )}
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.84rem',
                          color: '#4b5563',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {rev.comment}
                      </p>

                      {hasReplies && (
                        <button
                          type="button"
                          onClick={() => toggleRepliesExpand(rev.id)}
                          style={{
                            background: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#4b5563',
                            cursor: 'pointer',
                            marginTop: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          💬 {rev.replies.length} {rev.replies.length === 1 ? 'Reply' : 'Replies'}{' '}
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      )}
                    </div>

                    {/* Date Submitted Column */}
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      {rev.createdAt
                        ? new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </div>

                    {/* Actions Column */}
                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(rev)}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#dc2626',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                        title="Delete review and replies"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Expandable Nested Replies Preview */}
                  {hasReplies && isExpanded && (
                    <div
                      style={{
                        padding: '12px 24px 16px 48px',
                        background: '#faf7f2',
                        borderTop: '1px dashed #e5dbcb',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <strong style={{ fontSize: '0.78rem', color: '#78350f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Nested Public Replies ({rev.replies.length}):
                      </strong>
                      {rev.replies.map((reply) => (
                        <div
                          key={reply.id}
                          style={{
                            background: '#fff',
                            border: '1px solid #e7ded0',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <strong style={{ color: '#1f142c' }}>{reply.userName || 'Somnera Member'}</strong>
                            <span style={{ color: '#9ca3af', fontSize: '0.72rem' }}>
                              {reply.createdAt
                                ? new Date(reply.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Recent'}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#4b5563' }}>{reply.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          title="Confirm Review Deletion"
          onClose={() => !deleting && setDeleteTarget(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, color: '#374151', fontSize: '0.92rem', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete this customer review?
            </p>

            <div
              style={{
                background: '#faf7f2',
                border: '1px solid #e5dbcb',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ marginBottom: '4px' }}>
                <strong>Customer:</strong> {deleteTarget.userName || 'Customer'}{' '}
                {deleteTarget.userEmail && `(${deleteTarget.userEmail})`}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Product:</strong> {deleteTarget.product?.name || deleteTarget.productId}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Rating:</strong> {deleteTarget.rating} / 5 ★
              </div>
              <div style={{ color: '#4b5563', fontStyle: 'italic' }}>
                "{deleteTarget.comment}"
              </div>
            </div>

            {deleteTarget.replies && deleteTarget.replies.length > 0 && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#991b1b',
                  fontSize: '0.82rem',
                }}
              >
                ⚠️ <strong>Note:</strong> Deleting this review will also permanently delete its{' '}
                <strong>{deleteTarget.replies.length}</strong> associated public{' '}
                {deleteTarget.replies.length === 1 ? 'reply' : 'replies'}.
              </div>
            )}

            {deleteError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#dc2626',
                  fontSize: '0.85rem',
                }}
              >
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className="admin-print-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: '1px solid #b91c1c',
                  borderRadius: '6px',
                  padding: '7px 18px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Deleting Review...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </>
  );
}
