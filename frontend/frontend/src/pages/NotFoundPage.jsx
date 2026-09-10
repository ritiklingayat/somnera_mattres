import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="not-found-page" style={{ padding: '80px 0 100px', textAlign: 'center' }}>
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🛏️</div>
        <span style={{ color: '#0284c7', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          404 ERROR
        </span>
        <h1 style={{ fontFamily: "var(--font-display, 'Playfair Display', serif)", fontSize: '2.5rem', color: '#0f172a', margin: '12px 0' }}>
          Page Not Found
        </h1>
        <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.6, marginBottom: '32px' }}>
          The page you are looking for doesn't exist or has been moved. Let's get you back on track to finding your perfect comfort.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="button button-outline" style={{ border: '1px solid #cbd5e1', color: '#0f172a', padding: '12px 26px' }}>
            Go Home
          </Link>
          <Link to="/mattresses" className="button button-primary" style={{ padding: '12px 26px' }}>
            Browse Mattresses →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
