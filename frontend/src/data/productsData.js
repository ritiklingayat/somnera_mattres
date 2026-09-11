export const sizes = [
  '72x36',
  '72x48',
  '72x60',
  '72x72',
  '75x36',
  '75x48',
  '75x60',
  '75x72',
  '78x36',
  '78x48',
  '78x60',
  '78x72',
];

export function getPrice(product, size = '72x60', thickness = '6') {
  if (!product) return 0;

  const prices = product.prices || {};
  const rate = Number(prices[String(thickness)] ?? prices[thickness] ?? 0);

  if (rate > 0 && size) {
    const [lengthStr, widthStr] = String(size).toLowerCase().split('x');
    const length = Number(lengthStr) || 72;
    const width = Number(widthStr) || 60;
    const areaSqFt = (length * width) / 144;
    return Math.round(areaSqFt * rate);
  }

  // Fallback for non-mattress products or products without thickness rate
  const fixedPrice = Number(product.offerPrice ?? product.sellingPrice ?? product.price ?? 0);
  return isNaN(fixedPrice) ? 0 : fixedPrice;
}

export const products = [];
export const categories = [];
export const productsData = [];

export default {
  sizes,
  getPrice,
  products,
  categories,
  productsData,
};
