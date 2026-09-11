import { PriceRangeFilter } from './PriceRangeFilter';
import { FilterSection } from './FilterSection';
import {
  MATTRESS_NEED_OPTIONS,
  MATTRESS_USER_OPTIONS,
  MATTRESS_TECH_OPTIONS,
  MATTRESS_MATERIAL_OPTIONS,
  MATTRESS_FEEL_OPTIONS,
  MATTRESS_SIZE_OPTIONS,
  MATTRESS_THICKNESS_OPTIONS,
} from '../../config/productSections';

export function FilterSidebar({
  priceBounds,
  minPrice,
  setPriceRange,
  maxPrice,
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
  clearAllFilters,
  filterCounts = {},
}) {
  return (
    <aside className="filter-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="sidebar-heading">FILTERS</span>
        </div>
        <button type="button" className="clear-all-btn" onClick={clearAllFilters}>
          Clear
        </button>
      </div>

      <PriceRangeFilter
        min={priceBounds.min}
        max={priceBounds.max}
        currentMin={minPrice}
        currentMax={maxPrice}
        onChange={(newMin, newMax) => setPriceRange(newMin, newMax)}
      />

      <div className="sidebar-divider" />

      <FilterSection
        title="Mattress size"
        options={MATTRESS_SIZE_OPTIONS}
        selectedValues={selectedSizes}
        onToggle={toggleSize}
        counts={filterCounts.sizes}
        defaultOpen={true}
      />

      <div className="sidebar-divider" />

      <FilterSection
        title="Mattress thickness"
        options={MATTRESS_THICKNESS_OPTIONS}
        selectedValues={selectedThicknesses}
        onToggle={toggleThickness}
        counts={filterCounts.thicknesses}
        defaultOpen={true}
      />

      <div className="sidebar-divider" />

      <FilterSection
        title="Shop by need"
        options={MATTRESS_NEED_OPTIONS}
        selectedValues={selectedNeeds}
        onToggle={toggleNeed}
        counts={filterCounts.needs}
        defaultOpen={true}
      />

      <div className="sidebar-divider" />

      <FilterSection
        title="Shop by user"
        options={MATTRESS_USER_OPTIONS}
        selectedValues={selectedUserTypes}
        onToggle={toggleUserType}
        counts={filterCounts.userTypes}
        defaultOpen={true}
      />

      <div className="sidebar-divider" />

      <FilterSection
        title="Shop by tech"
        options={MATTRESS_TECH_OPTIONS}
        selectedValues={selectedTech}
        onToggle={toggleTech}
        counts={filterCounts.tech}
        defaultOpen={false}
      />

      <div className="sidebar-divider" />

      <FilterSection
        title="Mattress material"
        options={MATTRESS_MATERIAL_OPTIONS}
        selectedValues={selectedMaterials}
        onToggle={toggleMaterial}
        counts={filterCounts.materials}
        defaultOpen={true}
      />

      <div className="sidebar-divider" />

      <FilterSection
        title="Mattress feel"
        options={MATTRESS_FEEL_OPTIONS}
        selectedValues={selectedFeels}
        onToggle={toggleFeel}
        counts={filterCounts.feels}
        defaultOpen={true}
      />
    </aside>
  );
}
