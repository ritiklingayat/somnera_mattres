import { ProductCard } from './ProductCard';

export function ProductGrid({
  products = [],
  isLoading = false,
  addToCart,
  onQuickView,
  comparedProducts = [],
  onToggleCompare,
  clearAllFilters,
}) {
  if (isLoading) {
    return (
      <div className="product-grid-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-img shimmer" />
            <div className="skeleton-line shimmer" style={{ width: '40%' }} />
            <div className="skeleton-line shimmer" style={{ width: '70%' }} />
            <div className="skeleton-line shimmer" style={{ width: '50%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="no-products-container">
        <div className="no-products-icon">🛏️</div>
        <h3>No mattresses match your selected filters</h3>
        <p>Try adjusting your price range or clearing specific filters to see available mattresses.</p>
        <button type="button" className="button button-primary" onClick={clearAllFilters}>
          Clear All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="products-grid-layout">
      {products.map((product) => {
        const isCompared = comparedProducts.some((p) => p.id === product.id);
        return (
          <ProductCard
            key={product.id}
            product={product}
            addToCart={addToCart}
            onQuickView={onQuickView}
            isCompared={isCompared}
            onToggleCompare={onToggleCompare}
          />
        );
      })}
    </div>
  );
}
