import { useState, useEffect } from 'react';
import { getActiveOffersApi } from '../services/offerService';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

export function OffersPage({ onNavigate }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchOffers() {
      try {
        setLoading(true);
        setError('');
        const data = await getActiveOffersApi();
        if (active) {
          setOffers(data);
        }
      } catch (err) {
        if (active) {
          setError('Unable to load current offers. Please try again later.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOffers();
    return () => {
      active = false;
    };
  }, []);

  const handleClaim = (linkUrl) => {
    if (onNavigate) {
      onNavigate(linkUrl ? linkUrl.replace('#', '') : 'mattresses');
    } else {
      window.location.hash = linkUrl || '#mattresses';
    }
  };

  return (
    <div className="offers-page-wrapper">
      <div style={{ background: '#002b49', color: '#ffffff', padding: '60px 0', textAlign: 'center' }}>
        <div className="container">
          <span style={{ background: '#f59e0b', color: '#0f172a', fontWeight: '900', fontSize: '0.75rem', padding: '4px 12px', borderRadius: '4px', letterSpacing: '0.1em' }}>
            EXCLUSIVE DEALS & PROMOS
          </span>
          <h1 style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: '2.5rem', margin: '14px 0 8px' }}>
            Somnera Special Sleep Offers
          </h1>
          <p style={{ maxWidth: '600px', margin: '0 auto', color: '#cbd5e1', fontSize: '1rem' }}>
            Save on premium orthopaedic support, natural latex and memory foam comfort with free doorstep delivery across India.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '50px 0 80px' }}>
        {loading ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <LoadingSpinner label="Loading active offers..." inline />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#dc2626' }}>
            <p>{error}</p>
          </div>
        ) : offers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <h3>No promotional offers currently running.</h3>
            <p>Please check back soon for seasonal sales and celebratory deals!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
            {offers.map((offer) => (
              <div
                key={offer.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {offer.bannerImageUrl && (
                  <div style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={offer.bannerImageUrl}
                      alt={offer.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {offer.discountPercent && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: '#e86315',
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '0.8rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        {offer.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                )}

                <div style={{ padding: '24px', flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', color: '#0f172a', margin: '0 0 10px', fontWeight: '800' }}>
                      {offer.title}
                    </h2>
                    {offer.subtitle && (
                      <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.5, margin: '0 0 16px' }}>
                        {offer.subtitle}
                      </p>
                    )}
                  </div>

                  <div>
                    {offer.couponCode && (
                      <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>Coupon Code:</span>
                        <strong style={{ fontSize: '1rem', color: '#e86315', letterSpacing: '0.05em' }}>{offer.couponCode}</strong>
                      </div>
                    )}

                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => handleClaim(offer.linkUrl)}
                      style={{ width: '100%', padding: '12px', background: '#e86315', color: '#ffffff', fontWeight: '800', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      CLAIM OFFER & SHOP NOW <span>→</span>
                    </button>
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
