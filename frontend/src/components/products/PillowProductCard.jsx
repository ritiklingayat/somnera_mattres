import { getMinProductPrice } from '../../utils/productFilterUtils';
import { useAuth } from '../Account';
import useWishlistStatus from '../../hooks/useWishlistStatus';

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
  const {
    isLoggedIn,
    openAuthModal,
    showToast,
  } = useAuth();

  const {
    inWishlist,
    wishlistLoading,
    toggleWishlist,
  } = useWishlistStatus({
    productId: product.id,
    isLoggedIn,
    openAuthModal,
  });

  const handleWishlistToggle = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (wishlistLoading) {
      return;
    }

    try {
      const nextState = await toggleWishlist();
      if (showToast && isLoggedIn) {
        showToast(
          nextState
            ? `${product.name} added to your wishlist!`
            : `${product.name} removed from your wishlist.`
        );
      }
    } catch (error) {
      console.error('Wishlist update failed:', error);
    }
  };

  const handleProductNavigation = (event) => {
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      return;
    }
    event.preventDefault();
    window.location.hash = `product/${product.id}`;
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

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
      <div className="pillow-product-card__image">
        <a
          href={`#product/${product.id}`}
          className="pillow-product-card__image-link"
          onClick={handleProductNavigation}
          aria-label={`View details for ${product.name}`}
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
        </a>

        {/* Wishlist Button Overlay */}
        <button
          type="button"
          className={`pillow-wishlist-btn ${inWishlist ? 'is-active' : ''}`}
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          title={
            wishlistLoading
              ? 'Updating Wishlist...'
              : inWishlist
                ? 'Remove from Wishlist'
                : 'Add to Wishlist'
          }
          aria-label={
            inWishlist
              ? `Remove ${product.name} from Wishlist`
              : `Add ${product.name} to Wishlist`
          }
          aria-busy={wishlistLoading}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={inWishlist ? '#ef4444' : 'none'}
            stroke={inWishlist ? '#ef4444' : '#241132'}
            strokeWidth="2.2"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

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

        <h3>
          <a
            href={`#product/${product.id}`}
            onClick={handleProductNavigation}
            className="pillow-product-card__title-link"
          >
            {product.name}
          </a>
        </h3>

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
