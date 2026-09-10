export const PILLOW_PRICE_RANGES = [
  { id: 'under-500', label: 'Under ₹500', min: 0, max: 499.99 },
  { id: '500-1000', label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { id: '1000-1500', label: '₹1,000 – ₹1,500', min: 1000, max: 1500 },
  { id: '1500-2000', label: '₹1,500 – ₹2,000', min: 1500, max: 2000 },
  { id: '2000-plus', label: '₹2,000+', min: 2000, max: Number.POSITIVE_INFINITY },
];


export function getActivePillows(products = []) {
  return products.filter(
    (product) =>
      product?.productType === 'PILLOW' &&
      product?.isActive !== false,
  );
}


export function getPillowFilterValues(products = []) {
  const activePillows = getActivePillows(products);

  const unique = (key) => [
    ...new Set(
      activePillows
        .map((product) => product[key])
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return {
    materials: unique('material'),
    types: unique('pillowType'),
  };
}


export function filterAndSortPillows(
  products = [],
  {
    selectedMaterials = [],
    selectedTypes = [],
    selectedPriceRange = '',
    sortBy = 'featured',
  } = {},
) {
  const priceRange =
    PILLOW_PRICE_RANGES.find(
      (range) =>
        range.id === selectedPriceRange,
    );

  const filtered =
    getActivePillows(products).filter(
      (product) => {
        const matchesMaterial =
          selectedMaterials.length === 0 ||
          selectedMaterials.includes(
            product.material,
          );

        const matchesType =
          selectedTypes.length === 0 ||
          selectedTypes.includes(
            product.pillowType,
          );

        const numericPrice =
          Number(product.price);

        const matchesPrice =
          !priceRange ||
          (
            product.price != null &&
            Number.isFinite(numericPrice) &&
            numericPrice >= priceRange.min &&
            numericPrice <= priceRange.max
          );

        return matchesMaterial &&
          matchesType &&
          matchesPrice;
      },
    );

  return [...filtered].sort(
    (a, b) => {
      if (sortBy === 'price-low') {
        const aPrice = a.price == null
          ? Number.POSITIVE_INFINITY
          : Number(a.price);
        const bPrice = b.price == null
          ? Number.POSITIVE_INFINITY
          : Number(b.price);
        return aPrice - bPrice;
      }

      if (sortBy === 'price-high') {
        const aPrice = a.price == null
          ? Number.NEGATIVE_INFINITY
          : Number(a.price);
        const bPrice = b.price == null
          ? Number.NEGATIVE_INFINITY
          : Number(b.price);
        return bPrice - aPrice;
      }

      if (sortBy === 'newest') {
        return Number(b.id) - Number(a.id);
      }

      return Number(b.isFeatured) -
        Number(a.isFeatured);
    },
  );
}

