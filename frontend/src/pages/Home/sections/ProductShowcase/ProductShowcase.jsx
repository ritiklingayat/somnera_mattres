import { products as seedProducts } from '../../../../data/productsData';
import './ProductShowcase.css';

export default function ProductShowcase({ products = seedProducts, onSelectProduct }) {
  const displayProducts = products && products.length > 0 ? products : seedProducts;
  return (
    <section id="products" className="section products">
      <div className="container">
        <div className="products-heading">
          <div>
            <span className="section-kicker">The Somnera collection</span>
            <h2 className="section-title">
              Your sleep has a<br />
              signature style.
            </h2>
          </div>
          <p className="section-copy">
            From plush, pressure-relieving comfort to reassuring orthopaedic support, find the mattress
            that feels made for you.
          </p>
        </div>
        <div className="product-grid">
          {displayProducts.map((product, index) => (
            <article className={`product-card product-${index}`} key={product.id}>
              <div className="product-image">
                <a
                  href={`#product/${product.id}`}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;
                    e.preventDefault();
                    if (typeof onSelectProduct === 'function') {
                      onSelectProduct(product);
                    } else {
                      window.location.hash = `product/${product.id}`;
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="product-showcase-image-link"
                  aria-label={`View details for ${product.name}`}
                  style={{ display: 'block', width: '100%', height: '100%', cursor: 'pointer', textDecoration: 'none' }}
                >
                  <img src={product.image} alt={`${product.name} mattress`} style={{ cursor: 'pointer' }} />
                </a>
                {product.badge && <span>{product.badge}</span>}
              </div>
              <div className="product-content">
                <p>{product.category || product.eyebrow}</p>
                <h3>
                  <a
                    href={`#product/${product.id}`}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey || e.button === 1) return;
                      e.preventDefault();
                      if (typeof onSelectProduct === 'function') {
                        onSelectProduct(product);
                      } else {
                        window.location.hash = `product/${product.id}`;
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                  >
                    {product.name}
                  </a>
                </h3>
                <div className="product-meta">
                  <span>{product.firmness}</span>
                  <i></i>
                  <span>{product.warranty} warranty</span>
                </div>
                <button onClick={() => onSelectProduct(product)}>
                  View comfort & pricing <b>→</b>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
