import { getMinProductPrice } from '../../utils/productFilterUtils';

function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0
    ? `₹${amount.toLocaleString('en-IN')}`
    : null;
}


export function PillowProductCard({
  product,
  compact = false,
  addToCart,
}) {
  const effectivePriceVal =
    Number(product.price) > 0
      ? Number(product.price)
      : getMinProductPrice(product);

  const price = formatPrice(effectivePriceVal);

  const mrp = formatPrice(product.mrp);

  const hasDiscount =
    Number(product.mrp) > effectivePriceVal && effectivePriceVal > 0;

  const discount =
    hasDiscount
      ? Math.round((1 - effectivePriceVal / Number(product.mrp)) * 100)
      : 0;

  const isOutOfStock =
    product.stock != null &&
    Number(product.stock) <= 0;

  const packSize = Number(product.packSize) === 2 ? 2 : 1;


  return (
    <article
      className={
        `pillow-product-card${
          compact
            ? ' pillow-product-card--compact'
            : ''
        }`
      }
    >
      <button
        type="button"
        className="pillow-product-card__image"
        onClick={
          () => {
            window.location.hash =
              `product/${product.id}`;
            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }
        }
        aria-label={`View ${product.name}`}
      >
        {
          product.image
            ? (
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
              />
            )
            : (
              <span className="pillow-product-card__placeholder">
                Image coming soon
              </span>
            )
        }

        {
          discount > 0 && (
            <b>{discount}% off</b>
          )
        }
      </button>

      <div className="pillow-product-card__body">
        <p>
          {
            [
              product.material,
              product.pillowType,
            ].filter(Boolean).join(' · ') ||
            'Somnera Pillow'
          }
        </p>

        <h3>{product.name}</h3>

        <span className="pillow-product-card__pack">
          {packSize === 2 ? 'Pair of 2 pillows' : 'Single pillow'}
        </span>

        <div className="pillow-product-card__stock">
          <span
            className={
              isOutOfStock
                ? 'is-out'
                : ''
            }
          />
          {
            isOutOfStock
              ? 'Out of stock'
              : 'In stock'
          }
        </div>

        <div className="pillow-product-card__price">
          {
            price
              ? (
                <>
                  <strong>{price}</strong>
                  <span>
                    / {packSize === 2 ? 'pair' : 'pillow'}
                  </span>
                  {
                    hasDiscount && (
                      <del>{mrp}</del>
                    )
                  }
                </>
              )
              : (
                <strong>Price on request</strong>
              )
          }
        </div>

        <button
          type="button"
          className="pillow-product-card__view"
          onClick={
            (e) => {
              e.stopPropagation();
              if (typeof addToCart === 'function') {
                const isProtector =
                  product.productType === 'PROTECTOR' ||
                  product.productSection === 'PROTECTOR' ||
                  Boolean(product.protectorType);

                const sizeLabel = isProtector
                  ? 'Single (72x36 in • 18 sq ft)'
                  : (Array.isArray(product.availableSizes) && product.availableSizes[0]) || 'Standard';

                addToCart({
                  ...product,
                  size: sizeLabel,
                  price: effectivePriceVal,
                  quantity: 1,
                  packSize,
                });
              } else {
                window.location.hash =
                  `product/${product.id}`;
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth',
                });
              }
            }
          }
        >
          {addToCart ? 'Add to Cart →' : 'View product →'}
        </button>
      </div>
    </article>
  );
}
