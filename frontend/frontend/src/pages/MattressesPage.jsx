import { useState } from 'react';
import { useProductFilters } from '../hooks/useProductFilters';
import { MattressBanner } from '../components/products/MattressBanner';
import { ProductSortHeader } from '../components/products/ProductSortHeader';
import { ProductGrid } from '../components/products/ProductGrid';
import { FilterSidebar } from '../components/filters/FilterSidebar';
import { MobileFilterDrawer } from '../components/filters/MobileFilterDrawer';
import { ProductQuickViewModal } from '../components/products/ProductQuickViewModal';
import { CompareTrayModal } from '../components/products/CompareTrayModal';

import '../components/filters/Filters.css';
import '../components/products/Products.css';

export function MattressesPage({ products = [], addToCart }) {
  const {
    priceBounds,
    minPrice,
    maxPrice,
    setPriceRange,
    selectedNeeds,
    toggleNeed,
    selectedUserTypes,
    toggleUserType,
    selectedTech,
    toggleTech,
    selectedMaterials,
    toggleMaterial,
    selectedFeels,
    toggleFeel,
    selectedSizes,
    toggleSize,
    selectedThicknesses,
    toggleThickness,
    sortBy,
    setSortBy,
    clearAllFilters,
    activeFilterChips,
    filteredProducts,
    filterCounts,
    totalCount,
    filteredCount,
  } = useProductFilters(products);

  // Quick view state
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Compare state (up to 3 products)
  const [comparedProducts, setComparedProducts] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Mobile filter drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const handleToggleCompare = (product) => {
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 mattresses at a time.');
        return prev;
      }
      return [...prev, product];
    });
  };

  return (
    <div className="mattresses-page-wrapper">
      <div className="container" style={{ padding: '24px 0 60px' }}>
        {/* Top Banner */}
        <MattressBanner onCtaClick={() => {
          const el = document.getElementById('mattress-catalog-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }} />

        {/* Main Browsing Layout */}
        <div id="mattress-catalog-section" className="browsing-layout-container" style={{ display: 'flex', gap: '30px' }}>
          {/* Desktop Left Filter Sidebar */}
          <FilterSidebar
            priceBounds={priceBounds}
            minPrice={minPrice}
            maxPrice={maxPrice}
            setPriceRange={setPriceRange}
            selectedNeeds={selectedNeeds}
            toggleNeed={toggleNeed}
            selectedUserTypes={selectedUserTypes}
            toggleUserType={toggleUserType}
            selectedTech={selectedTech}
            toggleTech={toggleTech}
            selectedMaterials={selectedMaterials}
            toggleMaterial={toggleMaterial}
            selectedFeels={selectedFeels}
            toggleFeel={toggleFeel}
            selectedSizes={selectedSizes}
            toggleSize={toggleSize}
            selectedThicknesses={selectedThicknesses}
            toggleThickness={toggleThickness}
            clearAllFilters={clearAllFilters}
            filterCounts={filterCounts}
          />

          {/* Right Product Grid Area */}
          <main className="product-results-main" style={{ flex: 1 }}>
            <ProductSortHeader
              filteredCount={filteredCount}
              totalCount={totalCount}
              activeFilterChips={activeFilterChips}
              clearAllFilters={clearAllFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onOpenMobileFilter={() => setIsMobileFilterOpen(true)}
            />

            <ProductGrid
              products={filteredProducts}
              addToCart={addToCart}
              onQuickView={(prod) => setQuickViewProduct(prod)}
              comparedProducts={comparedProducts}
              onToggleCompare={handleToggleCompare}
              clearAllFilters={clearAllFilters}
            />
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filteredCount={filteredCount}
        priceBounds={priceBounds}
        minPrice={minPrice}
        maxPrice={maxPrice}
        setPriceRange={setPriceRange}
        selectedNeeds={selectedNeeds}
        toggleNeed={toggleNeed}
        selectedUserTypes={selectedUserTypes}
        toggleUserType={toggleUserType}
        selectedTech={selectedTech}
        toggleTech={toggleTech}
        selectedMaterials={selectedMaterials}
        toggleMaterial={toggleMaterial}
        selectedFeels={selectedFeels}
        toggleFeel={toggleFeel}
        selectedSizes={selectedSizes}
        toggleSize={toggleSize}
        selectedThicknesses={selectedThicknesses}
        toggleThickness={toggleThickness}
        clearAllFilters={clearAllFilters}
        filterCounts={filterCounts}
      />

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        addToCart={addToCart}
      />

      {/* Comparison Floating Tray & Side by Side Modal */}
      <CompareTrayModal
        comparedProducts={comparedProducts}
        onRemove={(id) => setComparedProducts((prev) => prev.filter((p) => p.id !== id))}
        onClearAll={() => setComparedProducts([])}
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(!isCompareModalOpen)}
      />
    </div>
  );
}
