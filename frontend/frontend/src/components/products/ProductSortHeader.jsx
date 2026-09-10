export function ProductSortHeader({
  filteredCount,
  totalCount,
  activeFilterChips = [],
  clearAllFilters,
  sortBy,
  setSortBy,
  onOpenMobileFilter,
}) {
  return (
    <div className="product-sort-header">
      <div className="results-info-row">
        <span className="results-count-text">
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> results
        </span>

        {/* Mobile Filter Button */}
        <button
          type="button"
          className="mobile-filter-trigger-btn"
          onClick={onOpenMobileFilter}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>FILTERS</span>
        </button>

        {/* Sort Select */}
        <div className="sort-dropdown-container">
          <label htmlFor="product-sort-select">SORT BY:</label>
          <select
            id="product-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
            <option value="newest">Newest</option>
            <option value="best-selling">Best Selling</option>
            <option value="customer-rating">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips Strip */}
      {activeFilterChips.length > 0 && (
        <div className="active-chips-strip">
          <span className="active-label">Active Filters:</span>
          <div className="chips-list">
            {activeFilterChips.map((chip) => (
              <span key={chip.id} className="active-chip">
                {chip.label}
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={chip.onRemove}
                  aria-label={`Remove filter ${chip.label}`}
                >
                  ✕
                </button>
              </span>
            ))}
            <button
              type="button"
              className="clear-all-chips-btn"
              onClick={clearAllFilters}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
