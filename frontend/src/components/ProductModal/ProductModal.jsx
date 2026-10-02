import { useEffect, useState } from "react";
import { getPrice, sizes } from "../../data/productsData";
import { siteConfig } from "../../config/siteConfig";
import { getAvailableThicknesses } from "../../utils/productUtils";
import "./ProductModal.css";

export default function ProductModal({ product, onClose }) {
  const thicknesses = getAvailableThicknesses(product);
  const [size, setSize] = useState("72x60");
  const [thickness, setThickness] = useState(thicknesses[0] || "6");

  useEffect(() => {
    if (thicknesses.length > 0 && !thicknesses.includes(thickness)) {
      setThickness(thicknesses[0]);
    }
  }, [thicknesses, thickness]);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const price = getPrice(product, size, thickness);
  const inquiry = encodeURIComponent(
    `Hello Somnera, I am interested in the ${product?.name || "mattress"} (${size}, ${thickness} inch). Please share more details.`,
  );

  return (
    <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${product?.name || "Product"} details`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close product details"
        >
          ×
        </button>
        <div className="modal-image">
          <a
            href={product?.id ? `#product/${product.id}` : '#'}
            onClick={(e) => {
              if (product?.id) {
                if (e.ctrlKey || e.metaKey || e.button === 1) return;
                e.preventDefault();
                onClose();
                window.location.hash = `product/${product.id}`;
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            aria-label={`View full details for ${product?.name}`}
            style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer', textDecoration: 'none' }}
          >
            <img src={product?.image} alt={product?.name} style={{ cursor: 'pointer' }} />
          </a>
        </div>
        <div className="modal-content">
          <p className="modal-kicker">{product?.eyebrow}</p>
          <h2>
            <a
              href={product?.id ? `#product/${product.id}` : '#'}
              onClick={(e) => {
                if (product?.id) {
                  if (e.ctrlKey || e.metaKey || e.button === 1) return;
                  e.preventDefault();
                  onClose();
                  window.location.hash = `product/${product.id}`;
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
            >
              {product?.name}
            </a>
          </h2>
          <p className="modal-description">{product?.description}</p>
          <div className="modal-stats">
            <span>
              <b>{product?.warranty}</b> warranty
            </span>
            <span>
              <b>{product?.firmness}</b> feel
            </span>
          </div>
          {thicknesses.length > 0 && (
            <div className="selector">
              <label>Choose a thickness</label>
              <div>
                {thicknesses.map((value) => (
                  <button
                    key={value}
                    onClick={() => setThickness(value)}
                    className={thickness === value ? "active" : ""}
                  >
                    {value}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="selector">
            <label>Choose a size</label>
            <select
              value={size}
              onChange={(event) => setSize(event.target.value)}
            >
              {sizes.map((value) => (
                <option value={value} key={value}>
                  {value.replace("x", " × ")} inches
                </option>
              ))}
            </select>
          </div>
          <div className="price-row">
            <span>Starting price</span>
            <strong>₹{(price || 0).toLocaleString("en-IN")}</strong>
          </div>
          <a
            className="button button-dark modal-button"
            href={`https://wa.me/${siteConfig.whatsapp}?text=${inquiry}`}
            target="_blank"
            rel="noreferrer"
          >
            Enquire on WhatsApp <span>→</span>
          </a>
          <p className="materials">
            <b>Inside:</b> {Array.isArray(product?.materials) ? product.materials.join(" · ") : (product?.materials || '')}
          </p>
        </div>
      </section>
    </div>
  );
}
