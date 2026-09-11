import { useEffect, useMemo, useState } from 'react';

import { CATALOG_CHANGED_EVENT } from '../db/database';
import { getShowrooms } from '../repositories/showroomRepository';

export function FindShowroomPage() {
  const [showrooms, setShowrooms] = useState([]);
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadShowrooms = async () => {
      try {
        setLoading(true);
        const records = await getShowrooms();
        if (!cancelled) {
          setShowrooms(records.filter((showroom) => showroom.isActive !== false));
          setError('');
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load showrooms.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadShowrooms();
    window.addEventListener(CATALOG_CHANGED_EVENT, loadShowrooms);
    return () => {
      cancelled = true;
      window.removeEventListener(CATALOG_CHANGED_EVENT, loadShowrooms);
    };
  }, []);

  const cities = useMemo(
    () => [...new Set(showrooms.map((showroom) => showroom.city))]
      .sort((left, right) => left.localeCompare(right)),
    [showrooms],
  );

  useEffect(() => {
    if (selectedCity !== 'ALL' && !cities.includes(selectedCity)) setSelectedCity('ALL');
  }, [cities, selectedCity]);

  const filteredShowrooms = showrooms.filter((store) => {
    if (selectedCity !== 'ALL' && store.city !== selectedCity) return false;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [store.name, store.address, store.city, store.phone, ...(store.facilities || [])]
      .join(' ').toLowerCase().includes(query);
  });

  const cityCount = (city) => showrooms.filter((showroom) => showroom.city === city).length;

  return (
    <div className="find-showroom-page">
      <div className="showroom-hero-banner" style={{ background: '#002b49', color: '#ffffff', padding: '60px 0', textAlign: 'center' }}>
        <div className="container">
          <span style={{ color: '#38bdf8', fontWeight: '800', letterSpacing: '0.12em', fontSize: '0.8rem' }}>
            SOMNERA EXPERIENCE STORES
          </span>
          <h1 style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: '2.5rem', margin: '12px 0' }}>
            Find a Somnera Showroom Near You
          </h1>
          <p style={{ maxWidth: '600px', margin: '0 auto', color: '#cbd5e1', fontSize: '1rem' }}>
            Experience our orthopaedic and memory foam mattresses in person. Test firmness levels with expert sleep consultants.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 0 80px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <select value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} aria-label="Filter showrooms by city" style={{ padding: '12px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '0.9rem' }}>
            <option value="ALL">All Cities ({showrooms.length})</option>
            {cities.map((city) => <option key={city} value={city}>{city} ({cityCount(city)})</option>)}
          </select>
          <input type="search" placeholder="Search by area, pincode or landmark..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} aria-label="Search showrooms" style={{ flex: 1, padding: '12px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
        </div>

        {error && <p className="account-form-error" role="alert">{error}</p>}
        {loading && <div className="module-empty"><h2>Loading showrooms...</h2></div>}
        {!loading && !error && filteredShowrooms.length === 0 && (
          <div className="module-empty"><h2>No showrooms found</h2><p>Try another city or search term.</p></div>
        )}

        {!loading && filteredShowrooms.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredShowrooms.map((store) => {
              const directionsUrl = store.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address}`)}`;
              return (
                <article key={store.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '0.72rem', fontWeight: '800', padding: '4px 10px', borderRadius: '6px' }}>{store.city}</span>
                    <h3 style={{ fontSize: '1.2rem', color: '#0f172a', margin: '12px 0 8px' }}>{store.name}</h3>
                    <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 12px', lineHeight: 1.5 }}>📍 {store.address}</p>
                    <p style={{ color: '#0284c7', fontSize: '0.85rem', fontWeight: '700', margin: '0 0 8px' }}>📞 {store.phone}</p>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 14px' }}>🕒 {store.hours}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                      {(store.facilities || []).map((facility) => <span key={facility} style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>✓ {facility}</span>)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a href={directionsUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', background: '#0f172a', color: '#ffffff', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', textDecoration: 'none' }}>Get Directions ↗</a>
                    <a href={`tel:${store.phone.replace(/[^+\d]/g, '')}`} style={{ border: '1px solid #cbd5e1', color: '#0f172a', padding: '10px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', textDecoration: 'none' }}>Call Store</a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
