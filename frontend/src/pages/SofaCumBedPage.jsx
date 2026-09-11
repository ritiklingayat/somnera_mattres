import { Link } from 'react-router-dom';
import { SimpleProductCard } from '../components/products/SimpleProductCard';

const FEATURES = [
  {
    title: 'Dual-Purpose Ergonomics',
    desc: 'Easily transforms from a stylish living room sofa into a luxurious plush mattress for deep overnight sleep.',
    icon: '🛋️',
  },
  {
    title: 'High-Density HR Foam',
    desc: 'Built with resilient high-density foam layers that prevent sag and retain structure through daily folding.',
    icon: '💎',
  },
  {
    title: 'Removable Washable Covers',
    desc: 'Premium stain-resistant fabric cover with full zipper for quick maintenance and effortless cleaning.',
    icon: '✨',
  },
];

export function SofaCumBedPage({ products = [] }) {
  return (
    <div className="sofa-cum-bed-page">
      <section className="category-hero" style={{ background: '#002b49', color: '#ffffff', padding: '60px 0', textAlign: 'center' }}>
        <div className="container">
          <span style={{ color: '#38bdf8', fontWeight: '800', letterSpacing: '0.12em', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            SOMNERA CONVERTIBLE FURNITURE
          </span>
          <h1 style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: '2.5rem', margin: '12px 0' }}>
            Sofa Cum Bed Collection
          </h1>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6 }}>
            Daytime seating meets nighttime comfort. Smart convertible furniture designed for modern space-saving homes.
          </p>
        </div>
      </section>

      <div className="container" style={{ padding: '50px 0 80px' }}>
        {/* Live admin-added products grid */}
        {products.length > 0 ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                AVAILABLE NOW
              </p>
              <h2 style={{ fontSize: '1.6rem', color: '#0f172a', margin: 0 }}>Our Sofa Cum Bed Collection</h2>
            </div>
            <div className="sofa-products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '48px' }}>
              {products.map((p) => (
                <SimpleProductCard key={p.id} product={p} />
              ))}
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 40px' }} />
          </>
        ) : null}

        {/* Features Grid */}
        <div className="sofa-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '50px' }}>
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>{feat.icon}</div>
              <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 8px 0' }}>{feat.title}</h2>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Status Box — only shown when no products added yet */}
        {products.length === 0 && (
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '48px 30px' }}>
            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: '800', padding: '6px 14px', borderRadius: '999px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Launching Soon
            </span>
            <h2 style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: '2rem', color: '#0f172a', margin: '16px 0 12px' }}>
              Sofa Cum Beds are currently in final crafting
            </h2>
            <p style={{ color: '#475569', fontSize: '0.98rem', lineHeight: 1.7, maxWidth: '620px', margin: '0 auto 28px' }}>
              We are finalising our flagship space-saving convertible sofas. In the meantime, discover our orthopaedic mattresses engineered for restorative sleep in every space.
            </p>
            <Link to="/mattresses" className="button button-primary" style={{ display: 'inline-flex', padding: '14px 32px' }}>
              Browse Mattresses →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
