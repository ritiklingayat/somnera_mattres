/**
 * Extracts and returns an array of valid thickness strings (e.g. ['4', '8']) for a product.
 * Filters out:
 * - 'pricePerSqFt'
 * - null, undefined, empty string (''), non-numeric, or non-positive (<= 0) rates.
 * Sorts numerically ascending.
 *
 * @param {object} product - The product object containing `prices`.
 * @returns {string[]} Sorted array of valid thickness strings (e.g. ['4', '8']).
 */
export function getAvailableThicknesses(product) {
  if (!product || typeof product !== 'object') return [];

  const prices = product.prices;
  if (!prices || typeof prices !== 'object') return [];

  return Object.keys(prices)
    .filter((key) => {
      if (key === 'pricePerSqFt') return false;
      const val = prices[key];
      if (val === null || val === undefined || val === '') return false;
      const num = Number(val);
      return !Number.isNaN(num) && Number.isFinite(num) && num > 0;
    })
    .sort((a, b) => Number(a) - Number(b));
}
