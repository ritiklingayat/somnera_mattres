import { useState, useEffect, useRef } from 'react';
import {
  getAdminOffersApi,
  createAdminOfferApi,
  updateAdminOfferApi,
  deleteAdminOfferApi,
} from '../../services/offerService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

export default function OffersBannersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [linkUrl, setLinkUrl] = useState('#products');
  const [bannerFile, setBannerFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fileInputRef = useRef(null);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminOffersApi();
      setOffers(data);
    } catch (err) {
      setError(err.message || 'Failed to load offers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const openCreateModal = () => {
    setEditingOffer(null);
    setTitle('');
    setSubtitle('');
    setCouponCode('');
    setDiscountPercent('');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setLinkUrl('#products');
    setBannerFile(null);
    setPreviewUrl('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setTitle(offer.title || '');
    setSubtitle(offer.subtitle || '');
    setCouponCode(offer.couponCode || '');
    setDiscountPercent(offer.discountPercent != null ? String(offer.discountPercent) : '');
    setStartDate(offer.startDate ? offer.startDate.slice(0, 10) : '');
    setEndDate(offer.endDate ? offer.endDate.slice(0, 10) : '');
    setIsActive(offer.isActive !== false);
    setLinkUrl(offer.linkUrl || '#products');
    setBannerFile(null);
    setPreviewUrl(offer.bannerImageUrl || '');
    setError('');
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Offer title is required.');
      return;
    }
    if (!editingOffer && !bannerFile && !previewUrl) {
      setError('Banner image is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('subtitle', subtitle.trim());
      if (couponCode.trim()) formData.append('couponCode', couponCode.trim());
      if (discountPercent) formData.append('discountPercent', discountPercent);
      if (startDate) formData.append('startDate', startDate);
      if (endDate) formData.append('endDate', endDate);
      formData.append('isActive', String(isActive));
      if (linkUrl.trim()) formData.append('linkUrl', linkUrl.trim());
      if (bannerFile) formData.append('image', bannerFile);
      if (!bannerFile && previewUrl) formData.append('bannerImageUrl', previewUrl);

      if (editingOffer) {
        await updateAdminOfferApi(editingOffer.id, formData);
        setSuccessMessage('Offer updated successfully!');
      } else {
        await createAdminOfferApi(formData);
        setSuccessMessage('Offer created successfully!');
      }

      setModalOpen(false);
      await loadOffers();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save offer.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, offerTitle) => {
    if (!window.confirm(`Are you sure you want to delete the offer "${offerTitle}"?`)) return;
    try {
      await deleteAdminOfferApi(id);
      setSuccessMessage('Offer deleted successfully.');
      await loadOffers();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete offer.');
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      const formData = new FormData();
      formData.append('isActive', String(!offer.isActive));
      await updateAdminOfferApi(offer.id, formData);
      await loadOffers();
    } catch (err) {
      alert(err.message || 'Failed to toggle offer status.');
    }
  };

  return (
    <div className="admin-page offers-banners-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Promotional Offers & Banners</h1>
          <p style={{ color: 'var(--admin-muted, #64748b)', margin: '4px 0 0' }}>
            Manage hero promo sliders, special festival banners, and seasonal discounts.
          </p>
        </div>
        <button
          type="button"
          className="admin-action-button"
          onClick={openCreateModal}
          style={{ background: '#e86315', color: '#fff', padding: '12px 20px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
        >
          + Create New Offer
        </button>
      </header>

      {successMessage && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
          {successMessage}
        </div>
      )}

      {error && !modalOpen && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <LoadingSpinner label="Loading offers from PostgreSQL..." inline />
        </div>
      ) : offers.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--admin-line, #e2e8f0)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <h3>No offers or promotional banners created yet.</h3>
          <p style={{ color: '#64748b' }}>Click the button above to add your first promotional campaign.</p>
        </div>
      ) : (
        <div className="admin-card" style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-line, #e2e8f0)', overflow: 'hidden' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--admin-line, #e2e8f0)' }}>
                <th style={{ padding: '14px 16px' }}>Banner Preview</th>
                <th style={{ padding: '14px 16px' }}>Offer Campaign</th>
                <th style={{ padding: '14px 16px' }}>Discount & Code</th>
                <th style={{ padding: '14px 16px' }}>Target Link</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', width: '120px' }}>
                    {offer.bannerImageUrl ? (
                      <img
                        src={offer.bannerImageUrl}
                        alt={offer.title}
                        style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    ) : (
                      <div style={{ width: '100px', height: '60px', background: '#f1f5f9', borderRadius: '6px', display: 'grid', placeItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                        No Image
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{offer.title}</strong>
                    {offer.subtitle && (
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0', maxWidth: '340px' }}>
                        {offer.subtitle}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {offer.discountPercent ? (
                      <span style={{ fontWeight: 800, color: '#e86315' }}>{offer.discountPercent}% OFF</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>Promo</span>
                    )}
                    {offer.couponCode && (
                      <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '2px', fontWeight: 700 }}>
                        Code: <code>{offer.couponCode}</code>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748b' }}>
                    {offer.linkUrl || '#products'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge
                      status={offer.isActive ? 'Active' : 'Inactive'}
                      variant={offer.isActive ? 'success' : 'neutral'}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(offer)}
                        style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        {offer.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(offer)}
                        style={{ padding: '6px 12px', border: '1px solid #0284c7', background: '#f0f9ff', color: '#0284c7', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(offer.id, offer.title)}
                        style={{ padding: '6px 12px', border: '1px solid #ef4444', background: '#fef2f2', color: '#ef4444', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{editingOffer ? 'Edit Promotional Offer' : 'Create Promotional Offer'}</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>Campaign Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Monsoon Sleep Celebration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>Subtitle / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Enjoy extra savings on all Orthopaedic mattresses."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>Discount % (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 25"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>Coupon Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. WELCOME10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>Banner Image (Cloudinary Direct Upload) *</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />
                {previewUrl && (
                  <div style={{ marginTop: '10px', position: 'relative', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>Start Date (Optional)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>Target Link</label>
                <input
                  type="text"
                  placeholder="#products"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                <input
                  type="checkbox"
                  id="offerIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="offerIsActive" style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Active immediately (show on storefront)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  style={{ padding: '10px 18px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '10px 22px', border: 'none', background: '#e86315', color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Saving...' : editingOffer ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
