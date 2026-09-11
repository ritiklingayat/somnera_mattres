import { getPrice } from '../data/productsData';
import {
  MATTRESS_SIZE_OPTIONS,
} from '../config/productSections';

export const normalizeText = (text = '') =>
  String(text).toLowerCase().trim().replace(/[-_]/g, ' ');

// Centralized normalization for user-selected filter values.
// Treats "Medium Firm", "medium firm", "medium-firm", " MEDIUM FIRM " as equivalent.
export const normalizeFilterValue = (value = '') =>
  normalizeText(value).replace(/®/g, '').replace(/\s+/g, ' ');

// Calculate lowest available price for a product
export function getMinProductPrice(product) {
  if (!product) return 0;

  // If fixed numerical price exists
  if (typeof product.price === 'number' && product.price > 0) {
    return product.price;
  }

  // If prices object with thickness exists
  const pricesObj = product.prices || {};
  const thicknesses = Object.keys(pricesObj);

  if (thicknesses.length > 0) {
    const validPrices = thicknesses
      .map((t) => {
        const p = getPrice(product, '72x60', t);
        return p;
      })
      .filter((val) => val > 0);

    if (validPrices.length > 0) {
      return Math.min(...validPrices);
    }
  }

  // Fallback check
  const calculated = getPrice(product, '72x60');
  return calculated > 0 ? calculated : 5000;
}

// Map product metadata attributes safely
export function extractProductMeta(product) {
  if (!product) {
    return {
      normCategory: '',
      normName: '',
      normDesc: '',
      normFirmness: '',
      materials: [],
      needs: [],
      userTypes: [],
      tech: [],
      feels: [],
      sizes: [],
      thicknesses: [],
      minPrice: 0,
    };
  }

  const normCategory = normalizeText(product.category || product.eyebrow || '');
  const normName = normalizeText(product.name || '');
  const normDesc = normalizeText(product.description || '');
  const normFirmness = normalizeText(product.firmness || '');
  
  const rawMaterials = Array.isArray(product.materials)
    ? product.materials
    : typeof product.materials === 'string' && product.materials
    ? product.materials.split(',')
    : [];
  const materials = rawMaterials.map(normalizeText).filter(Boolean);

  const rawNeeds = Array.isArray(product.needs)
    ? product.needs
    : product.need
    ? [product.need]
    : [];
  const needs = rawNeeds.map(normalizeText).filter(Boolean);

  const rawUserTypes = Array.isArray(product.userTypes)
    ? product.userTypes
    : product.userType
    ? [product.userType]
    : [];
  const userTypes = rawUserTypes.map(normalizeText).filter(Boolean);

  const rawTech = Array.isArray(product.tech)
    ? product.tech
    : Array.isArray(product.technologies)
    ? product.technologies
    : product.tech || product.technology
    ? [product.tech || product.technology]
    : [];
  const tech = rawTech.map(normalizeText).filter(Boolean);

  // feels: explicit array from admin form, falling back to firmness string
  const rawFeels = Array.isArray(product.feels) && product.feels.length > 0
    ? product.feels
    : product.firmness
    ? [product.firmness]
    : [];
  const feels = rawFeels.map(normalizeText).filter(Boolean);

  const rawSizes =
    Array.isArray(product.availableSizes) && product.availableSizes.length > 0
      ? product.availableSizes
      : MATTRESS_SIZE_OPTIONS;
  const sizes = rawSizes.map(normalizeText).filter(Boolean);

  const thicknesses = Object.keys(product.prices || {})
    .filter((thickness) => Number(product.prices[thickness]) > 0)
    .map((thickness) => normalizeText(`${thickness} inch`));

  return {
    normCategory,
    normName,
    normDesc,
    normFirmness,
    materials,
    needs,
    userTypes,
    tech,
    feels,
    sizes,
    thicknesses,
    minPrice: getMinProductPrice(product),
  };
}

// Calculate dynamic min & max price from catalog
export function getCatalogPriceBounds(products = []) {
  if (!products.length) return { min: 4500, max: 100000 };

  const prices = products.map(getMinProductPrice).filter((p) => p > 0);
  if (!prices.length) return { min: 4500, max: 100000 };

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return {
    min: Math.floor(min / 100) * 100,
    max: Math.ceil(max / 1000) * 1000 || 100000,
  };
}

// Filter product list based on filter criteria
export function filterProducts(products = [], filters = {}) {
  const {
    searchQuery = '',
    category = 'All',
    minPrice = 0,
    maxPrice = Infinity,
    needs = [],
    userTypes = [],
    tech = [],
    materials = [],
    feels = [],
    sizes = [],
    thicknesses = [],
  } = filters;

  return products.filter((product) => {
    const meta = extractProductMeta(product);

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = normalizeText(searchQuery);
      const matchName = meta.normName.includes(q);
      const matchDesc = meta.normDesc.includes(q);
      const matchCat = meta.normCategory.includes(q);
      const matchMat = meta.materials.some((m) => m.includes(q));
      if (!matchName && !matchDesc && !matchCat && !matchMat) return false;
    }

    // 2. Category / Nav match
    if (category && category !== 'All') {
      const catNorm = normalizeFilterValue(category);
      if (catNorm !== 'all mattresses') {
        const catMatch =
          meta.normCategory.includes(catNorm) ||
          meta.normName.includes(catNorm) ||
          meta.normDesc.includes(catNorm) ||
          meta.materials.some((m) => m.includes(catNorm)) ||
          meta.normFirmness.includes(catNorm);
        if (!catMatch) return false;
      }
    }

    // 3. Price Range
    if (meta.minPrice < minPrice || meta.minPrice > maxPrice) {
      return false;
    }

    // 4. Shop by Need
    if (needs.length > 0) {
      const matchNeed = needs.some((needOpt) => {
        const target = normalizeFilterValue(needOpt);
        return (
          meta.needs.some((n) => n.includes(target) || target.includes(n)) ||
          meta.normDesc.includes(target) ||
          meta.normName.includes(target) ||
          meta.materials.some((m) => m.includes(target))
        );
      });
      if (!matchNeed) return false;
    }

    // 5. Shop by User
    if (userTypes.length > 0) {
      const matchUser = userTypes.some((userOpt) => {
        const target = normalizeFilterValue(userOpt);
        return (
          meta.userTypes.some((u) => u.includes(target) || target.includes(u)) ||
          meta.normDesc.includes(target) ||
          meta.normName.includes(target)
        );
      });
      if (!matchUser) return false;
    }

    // 6. Shop by Tech
    if (tech.length > 0) {
      const matchTech = tech.some((techOpt) => {
        const target = normalizeFilterValue(techOpt);
        return (
          meta.tech.some((t) => t.includes(target) || target.includes(t)) ||
          meta.normDesc.includes(target) ||
          meta.normName.includes(target) ||
          meta.materials.some((m) => m.includes(target))
        );
      });
      if (!matchTech) return false;
    }

    // 7. Mattress Material
    if (materials.length > 0) {
      const matchMat = materials.some((matOpt) => {
        const target = normalizeFilterValue(matOpt);
        return (
          meta.materials.some((m) => m.includes(target) || target.includes(m)) ||
          meta.normDesc.includes(target) ||
          meta.normName.includes(target)
        );
      });
      if (!matchMat) return false;
    }

    // 8. Mattress Feel / Firmness
    if (feels.length > 0) {
      const matchFeel = feels.some((feelOpt) => {
        const target = normalizeFilterValue(feelOpt);
        // First check the new explicit feels array
        if (meta.feels && meta.feels.some((f) => f.includes(target) || target.includes(f))) return true;
        // Fallback: match against firmness string
        return (
          meta.normFirmness.includes(target) ||
          target.includes(meta.normFirmness) ||
          (target.includes('gentle') && (meta.normFirmness.includes('plush') || meta.normFirmness.includes('gentle'))) ||
          (target.includes('soft') && (meta.normFirmness.includes('plush') || meta.normFirmness.includes('soft'))) ||
          (target.includes('medium firm') && meta.normFirmness.includes('medium')) ||
          (target.includes('firm') && meta.normFirmness.includes('firm'))
        );
      });
      if (!matchFeel) return false;
    }

    // 9. Available mattress size
    if (sizes.length > 0) {
      const matchSize = sizes.some((size) =>
        meta.sizes.includes(normalizeFilterValue(size))
      );
      if (!matchSize) return false;
    }

    // 10. Available mattress thickness
    if (thicknesses.length > 0) {
      const matchThickness = thicknesses.some((thickness) =>
        meta.thicknesses.includes(normalizeFilterValue(thickness))
      );
      if (!matchThickness) return false;
    }

    return true;
  });
}

// Sort products based on sort criteria
export function sortProducts(products = [], sortBy = 'relevance') {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-low-high':
      return sorted.sort((a, b) => getMinProductPrice(a) - getMinProductPrice(b));
    case 'price-high-low':
      return sorted.sort((a, b) => getMinProductPrice(b) - getMinProductPrice(a));
    case 'newest':
      return sorted.reverse();
    case 'best-selling':
      return sorted.sort((a, b) => (b.reviewCount || 30) - (a.reviewCount || 30));
    case 'customer-rating':
      return sorted.sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
    case 'relevance':
    default:
      return sorted;
  }
}

// Calculate dynamic counts for filter options
export function calculateFilterCounts(products = []) {
  const counts = {
    needs: {},
    userTypes: {},
    tech: {},
    materials: {},
    feels: {},
    sizes: {},
    thicknesses: {},
  };

  const addVal = (map, val) => {
    if (!val) return;
    const str = String(val).trim();
    if (!str) return;
    map[str] = (map[str] || 0) + 1;
    const norm = normalizeText(str);
    if (norm && norm !== str) {
      map[norm] = (map[norm] || 0) + 1;
    }
  };

  products.forEach((product) => {
    const needs = Array.isArray(product?.needs)
      ? product.needs
      : product?.need
      ? [product.need]
      : [];
    const userTypes = Array.isArray(product?.userTypes)
      ? product.userTypes
      : product?.userType
      ? [product.userType]
      : [];
    const tech = Array.isArray(product?.tech)
      ? product.tech
      : Array.isArray(product?.technologies)
      ? product.technologies
      : product?.tech || product?.technology
      ? [product.tech || product.technology]
      : [];
    const materials = Array.isArray(product?.materials)
      ? product.materials
      : typeof product?.materials === 'string'
      ? product.materials.split(',')
      : [];
    // feels: explicit array takes priority, fallback to firmness
    const feels = Array.isArray(product?.feels) && product.feels.length > 0
      ? product.feels
      : product?.firmness
      ? [product.firmness]
      : [];
    const sizes = Array.isArray(product?.availableSizes) && product.availableSizes.length > 0
      ? product.availableSizes
      : MATTRESS_SIZE_OPTIONS;
    const thicknesses = Object.keys(product?.prices || {})
      .filter((thickness) => Number(product.prices[thickness]) > 0)
      .map((thickness) => `${thickness} inch`);

    needs.forEach((n) => addVal(counts.needs, n));
    userTypes.forEach((u) => addVal(counts.userTypes, u));
    tech.forEach((t) => addVal(counts.tech, t));
    materials.forEach((m) => addVal(counts.materials, m));
    feels.forEach((f) => addVal(counts.feels, f));
    sizes.forEach((s) => addVal(counts.sizes, s));
    thicknesses.forEach((t) => addVal(counts.thicknesses, t));
  });

  return counts;
}


