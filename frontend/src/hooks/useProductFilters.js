import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getCatalogPriceBounds,
  filterProducts,
  sortProducts,
  calculateFilterCounts,
  normalizeFilterValue,
} from '../utils/productFilterUtils';

// Parse a comma separated URL param into a clean string list
const toList = (value = '') =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);


const POPULAR_LABELS = {
  'best-seller': 'Best Sellers',
  'new-arrival': 'New Arrivals',
};

/**
 * URL-driven product filters. The browser query string is the single source
 * of truth for the active filter state, which keeps the UI in sync with
 * browser Back/Forward and survives page refreshes.
 */
export function useProductFilters(products = []) {
  const [searchParams, setSearchParams] = useSearchParams();

  const priceBounds = useMemo(() => getCatalogPriceBounds(products), [products]);

  const rawCategory = searchParams.get('collection') || searchParams.get('category') || 'All';
  const category = rawCategory.trim() || 'All';

  const rawMin = Number(searchParams.get('minPrice'));
  const rawMax = Number(searchParams.get('maxPrice'));
  const minPrice = Number.isFinite(rawMin) && rawMin > 0 ? rawMin : priceBounds.min;
  const maxPrice = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : priceBounds.max;

  const selectedNeeds = toList(searchParams.get('need'));
  const selectedUserTypes = toList(searchParams.get('user'));
  const selectedTech = toList(searchParams.get('tech'));
  const selectedMaterials = toList(searchParams.get('material'));
  const selectedFeels = toList(searchParams.get('feel'));
  const selectedSizes = toList(searchParams.get('size'));
  const selectedThicknesses = toList(searchParams.get('thickness'));
  const popular = (searchParams.get('popular') || '').trim();
  const sortParam = (searchParams.get('sort') || '').trim();
  const searchQuery = searchParams.get('q') || '';

  // Generic param updater. Passing null / '' / [] removes the key.
  const updateParams = useCallback(
    (updates, options = {}) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') {
            next.delete(key);
          } else if (Array.isArray(value)) {
            if (value.length) next.set(key, value.join(','));
            else next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });
        return next;
      }, options);
    },
    [setSearchParams]
  );

  // Toggle a multi-select list value (normalized comparison prevents duplicates)
  const toggleListValue = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const current = toList(next.get(key));
        const norm = normalizeFilterValue(value);
        const index = current.findIndex((item) => normalizeFilterValue(item) === norm);
        if (index >= 0) {
          current.splice(index, 1);
        } else {
          current.push(value);
        }
        if (current.length) next.set(key, current.join(','));
        else next.delete(key);
        return next;
      });
    },
    [setSearchParams]
  );

  const toggleNeed = useCallback((v) => toggleListValue('need', v), [toggleListValue]);
  const toggleUserType = useCallback((v) => toggleListValue('user', v), [toggleListValue]);
  const toggleTech = useCallback((v) => toggleListValue('tech', v), [toggleListValue]);
  const toggleMaterial = useCallback((v) => toggleListValue('material', v), [toggleListValue]);
  const toggleFeel = useCallback((v) => toggleListValue('feel', v), [toggleListValue]);
  const toggleSize = useCallback((v) => toggleListValue('size', v), [toggleListValue]);
  const toggleThickness = useCallback((v) => toggleListValue('thickness', v), [toggleListValue]);

  const setSortBy = useCallback((value) => updateParams({ sort: value || '' }), [updateParams]);

  const setCategory = useCallback(
    (value) => updateParams({ collection: value && value !== 'All' ? value : '', category: '' }),
    [updateParams]
  );

  const setPriceRange = useCallback(
    (newMin, newMax) => {
      updateParams(
        {
          minPrice: newMin > priceBounds.min ? newMin : '',
          maxPrice: newMax < priceBounds.max ? newMax : '',
        },
        { replace: true }
      );
    },
    [updateParams, priceBounds]
  );

  const clearAllFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // When no explicit sort is set, "popular" drives the ordering.
  const explicitSort = searchParams.has('sort');
  const effectiveSort = explicitSort
    ? sortParam
    : popular === 'best-seller'
    ? 'best-selling'
    : popular === 'new-arrival'
    ? 'newest'
    : 'relevance';

  const filteredProducts = useMemo(() => {
    let result = filterProducts(products, {
      searchQuery,
      category,
      minPrice,
      maxPrice,
      needs: selectedNeeds,
      userTypes: selectedUserTypes,
      tech: selectedTech,
      materials: selectedMaterials,
      feels: selectedFeels,
      sizes: selectedSizes,
      thicknesses: selectedThicknesses,
    });

    // Popularity filters only apply a hard filter when the backend product
    // data exposes the relevant flag. Otherwise the list is simply sorted,
    // so the UI never fabricates matches.
    if (popular === 'best-seller') {
      const hasField = products.some(
        (p) => p.bestSeller === true || p.isBestSeller === true || p.popular === true
      );
      if (hasField) {
        result = result.filter(
          (p) => p.bestSeller === true || p.isBestSeller === true || p.popular === true
        );
      }
    } else if (popular === 'new-arrival') {
      const hasField = products.some(
        (p) => p.newArrival === true || p.isNewArrival === true || p.isNew === true
      );
      if (hasField) {
        result = result.filter(
          (p) => p.newArrival === true || p.isNewArrival === true || p.isNew === true
        );
      }
    }

    return sortProducts(result, effectiveSort);
  }, [
    products,
    searchQuery,
    category,
    minPrice,
    maxPrice,
    selectedNeeds,
    selectedUserTypes,
    selectedTech,
    selectedMaterials,
    selectedFeels,
    selectedSizes,
    selectedThicknesses,
    popular,
    effectiveSort,
  ]);

  const filterCounts = useMemo(() => calculateFilterCounts(products), [products]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (category && category !== 'All') {
      chips.push({
        id: 'collection',
        label: category,
        onRemove: () => updateParams({ collection: '', category: '' }),
      });
    }
    if (popular) {
      chips.push({
        id: 'popular',
        label: POPULAR_LABELS[popular] || popular,
        onRemove: () => updateParams({ popular: '' }),
      });
    }
    selectedNeeds.forEach((n) =>
      chips.push({ id: `need-${n}`, label: n, onRemove: () => toggleNeed(n) })
    );
    selectedUserTypes.forEach((u) =>
      chips.push({ id: `user-${u}`, label: u, onRemove: () => toggleUserType(u) })
    );
    selectedTech.forEach((t) =>
      chips.push({ id: `tech-${t}`, label: t, onRemove: () => toggleTech(t) })
    );
    selectedMaterials.forEach((m) =>
      chips.push({ id: `mat-${m}`, label: m, onRemove: () => toggleMaterial(m) })
    );
    selectedFeels.forEach((f) =>
      chips.push({ id: `feel-${f}`, label: f, onRemove: () => toggleFeel(f) })
    );
    selectedSizes.forEach((s) =>
      chips.push({ id: `size-${s}`, label: s, onRemove: () => toggleSize(s) })
    );
    selectedThicknesses.forEach((t) =>
      chips.push({ id: `thickness-${t}`, label: t, onRemove: () => toggleThickness(t) })
    );
    if (minPrice > priceBounds.min || maxPrice < priceBounds.max) {
      chips.push({
        id: 'price-range',
        label: `₹${minPrice.toLocaleString('en-IN')} – ₹${maxPrice.toLocaleString('en-IN')}`,
        onRemove: () => updateParams({ minPrice: '', maxPrice: '' }),
      });
    }
    return chips;
  }, [
    category,
    popular,
    selectedNeeds,
    selectedUserTypes,
    selectedTech,
    selectedMaterials,
    selectedFeels,
    selectedSizes,
    selectedThicknesses,
    minPrice,
    maxPrice,
    priceBounds,
    toggleNeed,
    toggleUserType,
    toggleTech,
    toggleMaterial,
    toggleFeel,
    toggleSize,
    toggleThickness,
    updateParams,
  ]);

  return {
    priceBounds,
    minPrice,
    maxPrice,
    setPriceRange,
    selectedCategory: category,
    setCategory,
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
    sortBy: effectiveSort,
    setSortBy,
    searchQuery,
    clearAllFilters,
    activeFilterChips,
    filteredProducts,
    filterCounts,
    totalCount: products.length,
    filteredCount: filteredProducts.length,
  };
}
