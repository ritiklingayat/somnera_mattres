import {
  useEffect,
  useState,
} from 'react';

import {
  useAuth,
} from '../components/Account';

import {
  getWishlistApi,
  removeWishlistItemApi,
} from '../services/wishlistService';

import {
  getMinProductPrice,
} from '../utils/productFilterUtils';

import {
  getPrice,
} from '../data/productsData';

import LoadingSpinner
  from '../components/LoadingSpinner/LoadingSpinner';

import './WishlistPage.css';


export function WishlistPage({
  onNavigate,
  addToCart,
}) {

  const {
    isLoggedIn,
    openAuthModal,
  } = useAuth();


  const [
    wishlistItems,
    setWishlistItems,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    pageError,
    setPageError,
  ] = useState('');


  const [
    removingId,
    setRemovingId,
  ] = useState(null);


  /*
  ==================================================
  LOAD WISHLIST
  ==================================================
  */

  const loadWishlist =
    async () => {

      if (!isLoggedIn) {

        setWishlistItems([]);

        return;
      }


      try {

        setLoading(true);

        setPageError('');


        const response =
          await getWishlistApi();


        setWishlistItems(
          response.items,
        );


      } catch (error) {

        console.error(
          'Unable to load wishlist:',
          error,
        );


        setWishlistItems([]);


        setPageError(
          error.message ||
          'Unable to load your wishlist.',
        );


      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {

    loadWishlist();

  }, [
    isLoggedIn,
  ]);


  /*
  ==================================================
  SYNC WHEN HEART CHANGES ELSEWHERE
  ==================================================
  */

  useEffect(() => {

    const handleWishlistChange =
      () => {

        loadWishlist();
      };


    window.addEventListener(
      'somnera:wishlist-changed',
      handleWishlistChange,
    );


    return () => {

      window.removeEventListener(
        'somnera:wishlist-changed',
        handleWishlistChange,
      );
    };

  }, [
    isLoggedIn,
  ]);


  /*
  ==================================================
  REMOVE
  ==================================================
  */

  const handleRemove =
    async (
      productId,
    ) => {

      try {

        setRemovingId(
          productId,
        );

        setPageError('');


        const response =
          await removeWishlistItemApi(
            productId,
          );


        setWishlistItems(
          response.items,
        );


        window.dispatchEvent(
          new CustomEvent(
            'somnera:wishlist-changed',
          ),
        );


      } catch (error) {

        setPageError(
          error.message ||
          'Unable to remove product from wishlist.',
        );


      } finally {

        setRemovingId(null);
      }
    };


  /*
  ==================================================
  NAVIGATION
  ==================================================
  */

  const handleNav =
    (href) => {

      if (onNavigate) {

        onNavigate(href);

      } else {

        window.location.hash =
          href;
      }
    };


  /*
  ==================================================
  NOT LOGGED IN
  ==================================================
  */

  if (!isLoggedIn) {

    return (

      <div className="wishlist-page">

        <div className="container wishlist-unauth-container">

          <div className="wishlist-empty-card">

            <span className="empty-icon">
              🔒
            </span>


            <h2>
              Please log in to view your Wishlist
            </h2>


            <p>
              Your saved mattresses and accessories are stored securely in your Somnera account.
            </p>


            <button
              className="wishlist-primary-btn"
              onClick={
                () =>
                  openAuthModal(
                    'login',
                  )
              }
            >
              Log In / Sign Up
            </button>

          </div>

        </div>

      </div>
    );
  }


  /*
  ==================================================
  UI
  ==================================================
  */

  return (

    <div className="wishlist-page">

      <div className="wishlist-header">

        <div className="container">

          <span className="wishlist-kicker">
            YOUR SAVED FAVORITES
          </span>


          <h1>
            My Wishlist
          </h1>


          <p>
            Review and add your saved Somnera comfort items directly to cart.
          </p>

        </div>

      </div>


      <div className="container wishlist-container">

        {
          pageError && (

            <p
              className="account-form-error"
              role="alert"
            >
              {pageError}
            </p>
          )
        }


        {
          loading
            ? (

              <div
                style={{
                  padding:
                    '60px 20px',
                  textAlign:
                    'center',
                }}
              >

                <LoadingSpinner
                  label="Loading Wishlist..."
                />

              </div>
            )

            : wishlistItems.length ===
              0
              ? (

                <div className="wishlist-empty-card">

                  <span className="empty-icon">
                    🤍
                  </span>


                  <h2>
                    Your wishlist is empty.
                  </h2>


                  <p>
                    Explore our premium orthopaedic mattresses and sleep accessories to save your favorites.
                  </p>


                  <button
                    className="wishlist-primary-btn"
                    onClick={
                      () =>
                        handleNav(
                          'mattresses',
                        )
                    }
                  >
                    Browse Mattresses →
                  </button>

                </div>
              )

              : (

                <div className="wishlist-grid">

                  {
                    wishlistItems.map(
                      (product) => {

                        const thicknessKeys =
                          Object.keys(
                            product.prices ||
                            {},
                          );


                        const defaultThickness =
                          thicknessKeys.length >
                          0
                            ? thicknessKeys[0]
                            : '6';


                        const price =
                          getPrice(
                            product,
                            '72x60',
                            defaultThickness,
                          ) ||
                          getMinProductPrice(
                            product,
                          ) ||
                          0;


                        return (

                          <article
                            key={
                              product.id
                            }
                            className="wishlist-card"
                          >

                            <div className="wishlist-card-image-wrap">

                              <img
                                src={
                                  product.image
                                }
                                alt={
                                  product.name
                                }
                              />


                              {
                                product.badge && (

                                  <span className="wishlist-badge">
                                    {
                                      product.badge
                                    }
                                  </span>
                                )
                              }


                              <button
                                className="wishlist-remove-btn"
                                onClick={
                                  () =>
                                    handleRemove(
                                      product.id,
                                    )
                                }
                                disabled={
                                  removingId ===
                                  product.id
                                }
                                title="Remove from wishlist"
                                aria-label={
                                  `Remove ${product.name} from wishlist`
                                }
                              >

                                {
                                  removingId ===
                                  product.id
                                    ? '…'
                                    : '✕'
                                }

                              </button>

                            </div>


                            <div className="wishlist-card-content">

                              <p className="wishlist-category">

                                {
                                  product.category ||
                                  product.subcategory
                                }

                              </p>


                              <h3 className="wishlist-title">
                                {
                                  product.name
                                }
                              </h3>


                              <p className="wishlist-desc">
                                {
                                  product.description
                                }
                              </p>


                              {
                                price > 0 && (

                                  <div className="wishlist-price-row">

                                    <span className="price-label">
                                      Price:
                                    </span>


                                    <strong className="price-val">

                                      ₹
                                      {
                                        price.toLocaleString(
                                          'en-IN',
                                        )
                                      }

                                    </strong>

                                  </div>
                                )
                              }


                              <div className="wishlist-actions">

                                <button
                                  className="wishlist-details-btn"
                                  onClick={
                                    () =>
                                      handleNav(
                                        `product/${product.id}`,
                                      )
                                  }
                                >
                                  View Details
                                </button>


                                {
                                  addToCart && (

                                    <button
                                      className="wishlist-add-cart-btn"
                                      onClick={
                                        () => {

                                          /*
                                           * IMPORTANT:
                                           *
                                           * Do NOT remove product
                                           * from wishlist here.
                                           *
                                           * Phase 5 will replace this
                                           * frontend cart operation
                                           * with backend cart API.
                                           */

                                          addToCart({
                                            ...product,

                                            size:
                                              '72x60',

                                            thickness:
                                              defaultThickness,

                                            price,
                                          });
                                        }
                                      }
                                    >
                                      Add to Cart
                                    </button>
                                  )
                                }

                              </div>

                            </div>

                          </article>
                        );
                      },
                    )
                  }

                </div>
              )
        }

      </div>

    </div>
  );
}