import { Link } from 'react-router-dom';

export function MattressesMegaMenu({ categories = [], onClose, onNavigate, onMouseEnter, onMouseLeave }) {
  const handleNav = (href) => {
    onClose?.();
    if (onNavigate) {
      onNavigate(href);
    } else {
      window.location.hash = href;
    }
  };

  return (
    <div
      className="somnera-megamenu-panel"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="megamenu-inner container">
        <div className="megamenu-col">
          <h4 className="megamenu-col-title">SHOP BY TYPE</h4>
          <ul>
            <li>
              <a href="#mattresses" onClick={(e) => { e.preventDefault(); handleNav('mattresses'); }}>
                <strong>All Mattresses</strong>
              </a>
            </li>
            <li>
              <a href="#mattresses?collection=Orthopaedic" onClick={(e) => { e.preventDefault(); handleNav('mattresses?collection=Orthopaedic'); }}>
                Orthopaedic
              </a>
            </li>
            <li>
              <a href="#mattresses?material=Natural+Latex" onClick={(e) => { e.preventDefault(); handleNav('mattresses?material=Natural+Latex'); }}>
                Latex
              </a>
            </li>
            <li>
              <a href="#mattresses?material=Impressions+Foam" onClick={(e) => { e.preventDefault(); handleNav('mattresses?material=Impressions+Foam'); }}>
                Memory Foam
              </a>
            </li>
            <li>
              <a href="#mattresses?material=Pocket+Spring" onClick={(e) => { e.preventDefault(); handleNav('mattresses?material=Pocket+Spring'); }}>
                Spring
              </a>
            </li>
            <li>
              <a href="#mattresses?collection=Premium" onClick={(e) => { e.preventDefault(); handleNav('mattresses?collection=Premium'); }}>
                Premium Range
              </a>
            </li>
          </ul>
        </div>

        <div className="megamenu-col">
          <h4 className="megamenu-col-title">SHOP BY FIRMNESS</h4>
          <ul>
            <li>
              <a href="#mattresses?feel=Firm" onClick={(e) => { e.preventDefault(); handleNav('mattresses?feel=Firm'); }}>
                Firm Support
              </a>
            </li>
            <li>
              <a href="#mattresses?feel=Medium+Firm" onClick={(e) => { e.preventDefault(); handleNav('mattresses?feel=Medium+Firm'); }}>
                Medium Firm
              </a>
            </li>
            <li>
              <a href="#mattresses?feel=Gentle" onClick={(e) => { e.preventDefault(); handleNav('mattresses?feel=Gentle'); }}>
                Soft / Gentle Feel
              </a>
            </li>
          </ul>

          {categories.length > 0 && (
            <>
              <h4 className="megamenu-col-title" style={{ marginTop: '16px' }}>STORE CATEGORIES</h4>
              <ul>
                {categories.map((cat) => (
                  <li key={cat.id || cat.name}>
                    <a href={`#mattresses?category=${encodeURIComponent(cat.name)}`} onClick={(e) => { e.preventDefault(); handleNav(`mattresses?category=${encodeURIComponent(cat.name)}`); }}>
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="megamenu-col">
          <h4 className="megamenu-col-title">POPULAR</h4>
          <ul>
            <li>
              <a href="#mattresses?popular=best-seller" onClick={(e) => { e.preventDefault(); handleNav('mattresses?popular=best-seller'); }}>
                🔥 Best Sellers
              </a>
            </li>
            <li>
              <a href="#mattresses?popular=new-arrival" onClick={(e) => { e.preventDefault(); handleNav('mattresses?popular=new-arrival'); }}>
                ✨ New Arrivals
              </a>
            </li>
          </ul>
        </div>

        <div className="megamenu-col megamenu-featured-col">
          <span className="featured-tag">RECOMMENDED</span>
          <h4 className="featured-title">Find Your Sleep Match</h4>
          <p className="featured-desc">Take our quick firmness &amp; support test to discover your ideal Somnera mattress.</p>
          <a href="#mattresses" className="megamenu-cta-btn" onClick={(e) => { e.preventDefault(); handleNav('mattresses'); }}>
            Explore All Mattresses →
          </a>
        </div>
      </div>
    </div>
  );
}

export function PillowsMegaMenu({ onClose, onNavigate, onMouseEnter, onMouseLeave }) {
  const handleNav = (href) => {
    onClose?.();
    if (onNavigate) onNavigate(href);
    else window.location.hash = href;
  };

  return (
    <div
      className="somnera-dropdown-panel"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ul>
        <li>
          <a href="#pillows" onClick={(e) => { e.preventDefault(); handleNav('pillows'); }}>
            🛋️ Luxury Pillows
          </a>
        </li>
        <li>
          <a href="#pillows-protectors?type=protectors" onClick={(e) => { e.preventDefault(); handleNav('pillows-protectors?type=protectors'); }}>
            🛡️ Waterproof Mattress Protectors
          </a>
        </li>
        <li>
          <a href="#pillows-protectors?type=protectors" onClick={(e) => { e.preventDefault(); handleNav('pillows-protectors?type=protectors'); }}>
            ☁️ Pillow Protectors
          </a>
        </li>
        <li>
          <a href="#pillows-protectors?cat=accessories" onClick={(e) => { e.preventDefault(); handleNav('pillows-protectors'); }}>
            ✨ Sleep Accessories
          </a>
        </li>
      </ul>
    </div>
  );
}

export function SleepAdviceDropdown({ onClose, onNavigate, onMouseEnter, onMouseLeave }) {
  const handleNav = (href) => {
    onClose?.();
    if (onNavigate) onNavigate(href);
    else window.location.hash = href;
  };

  return (
    <div
      className="somnera-dropdown-panel"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ul>
        <li>
          <a href="#sleep-advice" onClick={(e) => { e.preventDefault(); handleNav('sleep-advice'); }}>
            📘 Mattress Buying Guide
          </a>
        </li>
        <li>
          <a href="#sleep-advice" onClick={(e) => { e.preventDefault(); handleNav('sleep-advice'); }}>
            ⚖️ How to Choose Mattress Firmness
          </a>
        </li>
        <li>
          <a href="#sleep-advice" onClick={(e) => { e.preventDefault(); handleNav('sleep-advice'); }}>
            📐 Mattress Size Guide
          </a>
        </li>
        <li>
          <a href="#sleep-advice" onClick={(e) => { e.preventDefault(); handleNav('sleep-advice'); }}>
            🌙 Sleep Tips &amp; Mattress Care
          </a>
        </li>
        <li>
          <a href="#sleep-advice" onClick={(e) => { e.preventDefault(); handleNav('sleep-advice'); }}>
            🩺 Back Support &amp; Ortho Insights
          </a>
        </li>
        <li>
          <a href="#sleep-advice" onClick={(e) => { e.preventDefault(); handleNav('sleep-advice'); }}>
            ❓ Frequently Asked Questions
          </a>
        </li>
      </ul>
    </div>
  );
}
