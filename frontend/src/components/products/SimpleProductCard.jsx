import {
  useAuth,
} from '../Account';

import {
  getMinProductPrice,
} from '../../utils/productFilterUtils';

import useWishlistStatus
  from '../../hooks/useWishlistStatus';


/**
 * Generic product card for
 * pillows, accessories and sofa products.
 */

function SimpleProductCard({
  product,
}) {

  const {
    isLoggedIn,
    openAuthModal,
  } = useAuth();


  /*
  ==================================================
  BACKEND WISHLIST
  ==================================================
  */

  const {
    inWishlist,
    wishlistLoading,
    toggleWishlist,
  } = useWishlistStatus({

    productId:
      product.id,

    isLoggedIn,

    openAuthModal,

  });


  /*
  ==================================================
  WISHLIST TOGGLE
  ==================================================
  */

  const handleWishlistToggle =
    async (event) => {

      event.stopPropagation();


      try {

        await toggleWishlist();


      } catch (error) {

        console.error(
          'Wishlist update failed:',
          error,
        );
      }
    };


  /*
  ==================================================
  PRODUCT DETAIL
  ==================================================
  */

  const handleEyeClick =
    (event) => {

      event.stopPropagation();


      window.location.hash =
        `product/${product.id}`;


      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };


  /*
  ==================================================
  PRICE
  ==================================================

  Note:
  For non-mattress products your backend
  currently doesn't provide a dedicated flat
  trusted price field.

  We keep the existing frontend display
  fallback for now.
  */

  const isMattress =
    product.productType ===
      'MATTRESS' ||
    product.productSection ===
      'MATTRESS';


  const price =
    isMattress
      ? getMinProductPrice(
          product,
        )
      : product.price != null &&
        Number.isFinite(
          Number(product.price),
        )
        ? Number(product.price)
        : null;


  const discountPercent =
    Number(product.mrp) >
      Number(price) &&
    Number(price) > 0
      ? Math.round(
          (
            1 -
            Number(price) /
              Number(product.mrp)
          ) * 100,
        )
      : isMattress
        ? product.discountPercent ||
          12
        : 0;


  const originalPrice =
    !isMattress &&
    Number(product.mrp) > 0
      ? Number(product.mrp)
      : Number(price) > 0
        ? Math.round(
            price *
            (
              1 +
              discountPercent /
              100
            ),
          )
        : null;


  /*
  ==================================================
  NAVIGATE
  ==================================================

  Your customer application uses hash routing,
  so don't use React Router <Link> here.
  */

  const handleViewDetails =
    () => {

      window.location.hash =
        `product/${product.id}`;


      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };


  return (

    <article
      className="simple-product-card"
      style={{
        background:
          '#ffffff',

        border:
          '1px solid #e2e8f0',

        borderRadius:
          '14px',

        overflow:
          'hidden',

        boxShadow:
          '0 4px 16px rgba(0,0,0,0.04)',

        display:
          'flex',

        flexDirection:
          'column',

        transition:
          'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={
        (event) => {

          event.currentTarget.style.transform =
            'translateY(-3px)';


          event.currentTarget.style.boxShadow =
            '0 10px 30px rgba(0,0,0,0.1)';
        }
      }
      onMouseLeave={
        (event) => {

          event.currentTarget.style.transform =
            'translateY(0)';


          event.currentTarget.style.boxShadow =
            '0 4px 16px rgba(0,0,0,0.04)';
        }
      }
    >

      {/* Image */}

      <div
        className="simple-product-card__image"
        style={{
          position:
            'relative',

          paddingTop:
            '65%',

          background:
            '#f8f5ef',

          overflow:
            'hidden',
        }}
      >

        <img
          src={
            product.image
          }
          alt={
            product.name
          }
          style={{
            position:
              'absolute',

            inset:
              0,

            width:
              '100%',

            height:
              '100%',

            objectFit:
              'contain',
          }}
          loading="lazy"
        />


        {
          product.badge && (

            <span
              style={{
                position:
                  'absolute',

                top:
                  10,

                left:
                  10,

                background:
                  '#241132',

                color:
                  '#d3af5d',

                fontSize:
                  '0.68rem',

                fontWeight:
                  800,

                padding:
                  '3px 8px',

                borderRadius:
                  4,

                letterSpacing:
                  '0.05em',
              }}
            >
              {
                product.badge
              }
            </span>
          )
        }


        {/* Action Overlay */}

        <div
          style={{
            position:
              'absolute',

            top:
              10,

            right:
              10,

            display:
              'flex',

            gap:
              6,

            zIndex:
              5,
          }}
        >

          {/* Wishlist */}

          <button
            type="button"
            onClick={
              handleWishlistToggle
            }
            disabled={
              wishlistLoading
            }
            title={
              inWishlist
                ? 'Remove from Wishlist'
                : 'Add to Wishlist'
            }
            aria-label={
              inWishlist
                ? `Remove ${product.name} from Wishlist`
                : `Add ${product.name} to Wishlist`
            }
            style={{
              width:
                32,

              height:
                32,

              borderRadius:
                '50%',

              background:
                'rgba(255, 255, 255, 0.95)',

              border:
                '1px solid rgba(0,0,0,0.1)',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              cursor:
                wishlistLoading
                  ? 'wait'
                  : 'pointer',

              opacity:
                wishlistLoading
                  ? 0.65
                  : 1,

              color:
                inWishlist
                  ? '#ef4444'
                  : '#0f172a',
            }}
          >

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={
                inWishlist
                  ? '#ef4444'
                  : 'none'
              }
              stroke={
                inWishlist
                  ? '#ef4444'
                  : 'currentColor'
              }
              strokeWidth="2.2"
            >

              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />

            </svg>

          </button>


          {/* View Details */}

          <button
            type="button"
            onClick={
              handleEyeClick
            }
            title="View Product Details"
            style={{
              width:
                32,

              height:
                32,

              borderRadius:
                '50%',

              background:
                'rgba(255, 255, 255, 0.95)',

              border:
                '1px solid rgba(0,0,0,0.1)',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              cursor:
                'pointer',

              color:
                '#0f172a',
            }}
          >

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >

              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />

              <circle
                cx="12"
                cy="12"
                r="3"
              />

            </svg>

          </button>

        </div>

      </div>


      {/* Content */}

      <div
        className="simple-product-card__body"
        style={{
          padding:
            '14px 16px 16px',

          flex:
            1,

          display:
            'flex',

          flexDirection:
            'column',

          gap:
            8,
        }}
      >

        <p
          style={{
            fontSize:
              '0.72rem',

            fontWeight:
              700,

            color:
              '#64748b',

            margin:
              0,

            textTransform:
              'uppercase',

            letterSpacing:
              '0.06em',
          }}
        >

          {
            product.category ||
            product.eyebrow
          }

        </p>


        <h3
          className="simple-product-card__title"
          style={{
            fontSize:
              '1rem',

            fontWeight:
              700,

            color:
              '#0f172a',

            margin:
              0,
          }}
        >
          {
            product.name
          }
        </h3>


        <p
          className="simple-product-card__description"
          style={{
            fontSize:
              '0.82rem',

            color:
              '#475569',

            margin:
              0,

            lineHeight:
              1.5,

            flex:
              1,
          }}
        >

          {
            product.description
          }

        </p>


        {
          price != null &&
          price > 0
            ? (

            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'baseline',

                gap:
                  8,

                marginTop:
                  4,
              }}
            >

              <strong
                style={{
                  fontSize:
                    '1.1rem',

                  color:
                    '#0f172a',
                }}
              >

                ₹
                {
                  price.toLocaleString(
                    'en-IN',
                  )
                }

              </strong>


              {
                originalPrice > price && (
              <del
                style={{
                  fontSize:
                    '0.82rem',

                  color:
                    '#94a3b8',
                }}
              >

                ₹
                {
                  originalPrice.toLocaleString(
                    'en-IN',
                  )
                }

              </del>
                )
              }


              {
                discountPercent > 0 && (
              <span
                style={{
                  fontSize:
                    '0.72rem',

                  fontWeight:
                    700,

                  color:
                    '#10b981',
                }}
              >

                {
                  discountPercent
                }
                % OFF

              </span>
                )
              }

            </div>
            )
            : (
              <strong
                style={{
                  color: '#0f172a',
                  fontSize: '1rem',
                  marginTop: 4,
                }}
              >
                Price on request
              </strong>
            )
        }


        <button
          type="button"
          onClick={
            handleViewDetails
          }
          style={{
            marginTop:
              8,

            padding:
              '9px 0',

            background:
              '#241132',

            color:
              '#d3af5d',

            border:
              'none',

            borderRadius:
              8,

            textAlign:
              'center',

            fontWeight:
              700,

            fontSize:
              '0.82rem',

            textDecoration:
              'none',

            display:
              'block',

            cursor:
              'pointer',

            width:
              '100%',

            transition:
              'background 0.2s ease',
          }}
          onMouseEnter={
            (event) => {

              event.currentTarget.style.background =
                '#3a1d4a';
            }
          }
          onMouseLeave={
            (event) => {

              event.currentTarget.style.background =
                '#241132';
            }
          }
        >
          View Details →
        </button>

      </div>

    </article>
  );
}


export {
  SimpleProductCard,
};
