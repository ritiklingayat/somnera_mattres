import { useState, useEffect } from 'react';
import { getPrice, sizes } from '../../data/productsData';

export function ProductQuickViewModal({ product, isOpen, onClose, addToCart }) {
  const thicknessKeys = Object.keys(product?.prices || {});
  const defaultThickness = thicknessKeys.length > 0 ? thicknessKeys[0] : '6';

  const [selectedSize, setSelectedSize] = useState('72x60');
  const [selectedThickness, setSelectedThickness] = useState(defaultThickness);

  useEffect(() => {
    if (product) {
      const keys = Object.keys(product.prices || {});
      if (keys.length > 0) setSelectedThickness(keys[0]);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const price = getPrice(product, selectedSize, selectedThickness);
  const materials = Array.isArray(product.materials) ? product.materials : [];

  return (
    <div className="quickview-modal-backdrop" onClick={onClose}>
      <div className="quickview-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="quickview-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="quickview-grid">
          <div className="quickview-image-col">
            <img src={product.image} alt={product.name} />
            {product.badge && <span className="quickview-badge">{product.badge}</span>}
          </div>

          <div className="quickview-details-col">
            <span className="quickview-eyebrow">
              {product.category} • {product.eyebrow}
            </span>
            <h2 className="quickview-title">{product.name}</h2>

            <div className="quickview-rating">
              <span>★★★★★</span>
              <strong>{product.rating || 4.8}</strong>
              <small>({product.reviewCount || 28} reviews)</small>
            </div>

            <p className="quickview-desc">{product.description}</p>

            <div className="quickview-specs-box">
              <div>
                <strong>Firmness:</strong> <span>{product.firmness || 'Medium firm'}</span>
              </div>
              <div>
                <strong>Warranty:</strong> <span>{product.warranty || '10 years'}</span>
              </div>
            </div>

            {materials.length > 0 && (
              <div className="quickview-materials">
                <strong>Key Materials:</strong>
                <div className="materials-tags">
                  {materials.map((m) => (
                    <span key={m} className="mat-tag">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Thickness selection */}
            {thicknessKeys.length > 0 && (
              <div className="quickview-option-row">
                <label>Thickness:</label>
                <div className="thickness-pills">
                  {thicknessKeys.map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={`thickness-pill ${t === selectedThickness ? 'active' : ''}`}
                      onClick={() => setSelectedThickness(t)}
                    >
                      {t}&quot;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            <div className="quickview-option-row">
              <label>Size:</label>
              <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                {sizes.map((s) => (
                  <option key={s} value={s}>
                    {s} in
                  </option>
                ))}
              </select>
            </div>

            <div className="quickview-price-row">
              <div>
                <small>Total Price</small>
                <strong className="price-val">₹{price.toLocaleString('en-IN')}</strong>
              </div>

              <button
                type="button"
                className="button button-primary quickview-add-btn"
                onClick={() => {
                  addToCart({
                    ...product,
                    size: selectedSize,
                    thickness: selectedThickness,
                    price,
                  });
                  onClose();
                }}
              >
                ADD TO CART
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
