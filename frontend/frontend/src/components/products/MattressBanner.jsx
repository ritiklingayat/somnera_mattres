export function MattressBanner({ onCtaClick }) {
  return (
    <div className="mattress-banner-container">
      <div className="banner-badge-strip">SOMNERA SLEEP COLLECTION</div>
      <div className="banner-content-row">
        <div className="banner-text-side">
          <h1 className="banner-title">Find Your Perfect Mattress</h1>
          <p className="banner-subtitle">
            3 simple steps to customise your ideal sleep surface for healthy back alignment & deep rest.
          </p>
        </div>

        <div className="banner-steps-wrapper">
          <div className="banner-step">
            <div className="step-number">1</div>
            <div className="step-info">
              <strong>Select Size</strong>
              <small>Single, Queen or King</small>
            </div>
          </div>
          <div className="step-arrow">›</div>

          <div className="banner-step">
            <div className="step-number">2</div>
            <div className="step-info">
              <strong>Select Firmness</strong>
              <small>Plush, Medium or Firm</small>
            </div>
          </div>
          <div className="step-arrow">›</div>

          <div className="banner-step">
            <div className="step-number">3</div>
            <div className="step-info">
              <strong>Select Comfort</strong>
              <small>Latex, Memory or Rebonded</small>
            </div>
          </div>
        </div>

        <button type="button" className="banner-cta-button" onClick={onCtaClick}>
          FIND MY MATTRESS
        </button>
      </div>
    </div>
  );
}
