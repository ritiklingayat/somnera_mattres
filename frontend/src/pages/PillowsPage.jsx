import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  PillowProductCard,
} from '../components/products/PillowProductCard';

import {
  PILLOW_PRICE_RANGES as PRICE_RANGES,
  filterAndSortPillows,
  getPillowFilterValues,
} from '../utils/pillowFilterUtils';

import './PillowsPage.css';


function readHashFilters() {
  const query =
    window.location.hash.split('?')[1] ||
    '';

  const params =
    new URLSearchParams(query);

  const list =
    (key) =>
      (params.get(key) || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    materials: list('material'),
    types: list('pillowType'),
    priceRange: params.get('price') || '',
    sort: params.get('sort') || 'featured',
  };
}


function writeHashFilters({
  materials,
  types,
  priceRange,
  sort,
}) {
  const params =
    new URLSearchParams();

  if (materials.length) {
    params.set('material', materials.join(','));
  }

  if (types.length) {
    params.set('pillowType', types.join(','));
  }

  if (priceRange) {
    params.set('price', priceRange);
  }

  if (sort && sort !== 'featured') {
    params.set('sort', sort);
  }

  const query = params.toString();
  const nextHash =
    `#pillows${query ? `?${query}` : ''}`;

  if (window.location.hash !== nextHash) {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${nextHash}`,
    );
  }
}


function FilterContent({
  availableMaterials,
  availableTypes,
  selectedMaterials,
  selectedTypes,
  selectedPriceRange,
  toggleMaterial,
  toggleType,
  setSelectedPriceRange,
  clearFilters,
  radioGroupName,
}) {
  return (
    <>
      <div className="pillow-filter-heading">
        <strong>Filter by</strong>
        <button type="button" onClick={clearFilters}>
          Clear all
        </button>
      </div>

      <details open>
        <summary>Material</summary>
        <div className="pillow-filter-options">
          {
            availableMaterials.map(
              (material) => (
                <label key={material}>
                  <input
                    type="checkbox"
                    checked={
                      selectedMaterials.includes(
                        material,
                      )
                    }
                    onChange={
                      () =>
                        toggleMaterial(material)
                    }
                  />
                  <span>{material}</span>
                </label>
              ),
            )
          }
        </div>
      </details>

      <details open>
        <summary>Type</summary>
        <div className="pillow-filter-options">
          {
            availableTypes.map(
              (type) => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={
                      selectedTypes.includes(type)
                    }
                    onChange={
                      () => toggleType(type)
                    }
                  />
                  <span>{type}</span>
                </label>
              ),
            )
          }
        </div>
      </details>

      <details open>
        <summary>Price range</summary>
        <div className="pillow-filter-options">
          {
            PRICE_RANGES.map(
              (range) => (
                <label key={range.id}>
                  <input
                    type="radio"
                    name={radioGroupName}
                    checked={
                      selectedPriceRange ===
                      range.id
                    }
                    onChange={
                      () =>
                        setSelectedPriceRange(
                          range.id,
                        )
                    }
                  />
                  <span>{range.label}</span>
                </label>
              ),
            )
          }
        </div>
      </details>
    </>
  );
}


export function PillowsPage({
  products = [],
}) {
  const initial =
    readHashFilters();

  const [selectedMaterials, setSelectedMaterials] =
    useState(initial.materials);
  const [selectedTypes, setSelectedTypes] =
    useState(initial.types);
  const [selectedPriceRange, setSelectedPriceRange] =
    useState(initial.priceRange);
  const [sortBy, setSortBy] =
    useState(initial.sort);
  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const filterValues =
    useMemo(
      () => getPillowFilterValues(
        products,
      ),
      [products],
    );

  const availableMaterials =
    filterValues.materials;

  const availableTypes =
    filterValues.types;

  const filteredPillows =
    useMemo(
      () => filterAndSortPillows(
        products,
        {
          selectedMaterials,
          selectedTypes,
          selectedPriceRange,
          sortBy,
        },
      ),
      [
      products,
      selectedMaterials,
      selectedTypes,
      selectedPriceRange,
      sortBy,
      ],
    );

  const activeFilterCount =
    selectedMaterials.length +
    selectedTypes.length +
    (selectedPriceRange ? 1 : 0);

  const toggleValue =
    (setter, value) =>
      setter(
        (current) =>
          current.includes(value)
            ? current.filter(
                (item) => item !== value,
              )
            : [...current, value],
      );

  const clearFilters = () => {
    setSelectedMaterials([]);
    setSelectedTypes([]);
    setSelectedPriceRange('');
  };

  useEffect(() => {
    writeHashFilters({
      materials: selectedMaterials,
      types: selectedTypes,
      priceRange: selectedPriceRange,
      sort: sortBy,
    });
  }, [
    selectedMaterials,
    selectedTypes,
    selectedPriceRange,
    sortBy,
  ]);

  useEffect(() => {
    document.body.style.overflow =
      mobileFiltersOpen
        ? 'hidden'
        : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFiltersOpen]);

  const filterProps = {
    availableMaterials,
    availableTypes,
    selectedMaterials,
    selectedTypes,
    selectedPriceRange,
    toggleMaterial:
      (value) =>
        toggleValue(
          setSelectedMaterials,
          value,
        ),
    toggleType:
      (value) =>
        toggleValue(
          setSelectedTypes,
          value,
        ),
    setSelectedPriceRange,
    clearFilters,
  };


  return (
    <div className="pillows-page">
      <header className="pillows-page__hero">
        <div className="container">
          <p>Somnera sleep essentials</p>
          <h1>Pillows for deeper, <em>better rest.</em></h1>
          <span>
            Discover breathable fiber and adaptive foam comfort designed for effortless everyday support.
          </span>
        </div>
      </header>

      <div className="container pillows-page__catalog">
        <aside className="pillow-filter-sidebar">
          <FilterContent
            {...filterProps}
            radioGroupName="pillow-price-range-desktop"
          />
        </aside>

        <main className="pillows-page__results">
          <div className="pillows-page__toolbar">
            <div>
              <h2>Pillows</h2>
              <p>
                {filteredPillows.length}{' '}
                {filteredPillows.length === 1
                  ? 'product'
                  : 'products'}
              </p>
            </div>

            <div className="pillows-page__toolbar-actions">
              <button
                type="button"
                className="pillow-mobile-filter-button"
                onClick={
                  () => setMobileFiltersOpen(true)
                }
              >
                Filters
                {
                  activeFilterCount > 0 && (
                    <b>{activeFilterCount}</b>
                  )
                }
              </button>

              <label>
                <span>Sort by</span>
                <select
                  value={sortBy}
                  onChange={
                    (event) =>
                      setSortBy(event.target.value)
                  }
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>
          </div>

          {
            filteredPillows.length > 0
              ? (
                <div className="pillow-product-grid">
                  {
                    filteredPillows.map(
                      (product) => (
                        <PillowProductCard
                          key={product.id}
                          product={product}
                        />
                      ),
                    )
                  }
                </div>
              )
              : (
                <div className="pillow-no-results">
                  <span aria-hidden="true">☾</span>
                  <h3>No pillows match the selected filters.</h3>
                  <p>Try changing or clearing your filters.</p>
                  <button type="button" onClick={clearFilters}>
                    Clear filters
                  </button>
                </div>
              )
          }
        </main>
      </div>

      {
        mobileFiltersOpen && (
          <div
            className="pillow-filter-drawer-backdrop"
            role="presentation"
            onMouseDown={
              (event) => {
                if (event.target === event.currentTarget) {
                  setMobileFiltersOpen(false);
                }
              }
            }
          >
            <aside
              className="pillow-filter-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Pillow filters"
            >
              <div className="pillow-filter-drawer__top">
                <strong>Filters</strong>
                <button
                  type="button"
                  onClick={
                    () => setMobileFiltersOpen(false)
                  }
                  aria-label="Close filters"
                >
                  ×
                </button>
              </div>

              <div className="pillow-filter-drawer__scroll">
                <FilterContent
                  {...filterProps}
                  radioGroupName="pillow-price-range-mobile"
                />
              </div>

              <div className="pillow-filter-drawer__actions">
                <button type="button" onClick={clearFilters}>
                  Clear
                </button>
                <button
                  type="button"
                  onClick={
                    () => setMobileFiltersOpen(false)
                  }
                >
                  Show {filteredPillows.length}{' '}
                  {filteredPillows.length === 1
                    ? 'product'
                    : 'products'}
                </button>
              </div>
            </aside>
          </div>
        )
      }
    </div>
  );
}
