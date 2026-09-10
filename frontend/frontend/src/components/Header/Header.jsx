import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import logo
  from '../../assets/images/somnera-logo.jpeg';

import {
  AccountDropdown,
  useAuth,
} from '../Account';

import {
  MattressesMegaMenu,
  PillowsMegaMenu,
  SleepAdviceDropdown,
} from './MegaMenu';

import {
  getWishlistApi,
} from '../../services/wishlistService';

import {
  getMinProductPrice,
} from '../../utils/productFilterUtils';

import {
  getPrice,
} from '../../data/productsData';

import './Header.css';


export default function Header({
  cartCount = 0,
  categories = [],
  catalog = [],
  onNavigate,
  searchQuery = '',
  onSearch,
}) {

  const {
    isLoggedIn,
    user,
    openAuthModal,
  } = useAuth();


  const [
    activeMegaMenu,
    setActiveMegaMenu,
  ] = useState(null);


  const [
    mobileDrawerOpen,
    setMobileDrawerOpen,
  ] = useState(false);


  const [
    mobileAccordion,
    setMobileAccordion,
  ] = useState(null);


  const [
    showSearchPopover,
    setShowSearchPopover,
  ] = useState(false);


  const [
    wishlistCount,
    setWishlistCount,
  ] = useState(0);


  const headerRef =
    useRef(null);


  const searchContainerRef =
    useRef(null);


  /*
  ==================================================
  WISHLIST COUNT
  ==================================================

  Wishlist count now comes from backend.

  Local wishlist repository

  No localStorage wishlist is used.
  */

  useEffect(() => {

    let cancelled = false;


    const loadWishlistCount =
      async () => {

        if (!isLoggedIn) {

          if (!cancelled) {
            setWishlistCount(0);
          }

          return;
        }


        try {

          const response =
            await getWishlistApi();


          if (!cancelled) {

            setWishlistCount(
              Number(
                response.totalItems ||
                0,
              ),
            );
          }


        } catch (error) {

          console.error(
            'Unable to load wishlist count:',
            error,
          );


          if (!cancelled) {
            setWishlistCount(0);
          }
        }
      };


    loadWishlistCount();


    /*
     * Heart buttons and WishlistPage
     * dispatch this event whenever the
     * backend wishlist changes.
     */

    const handleWishlistChange =
      () => {

        loadWishlistCount();
      };


    window.addEventListener(
      'somnera:wishlist-changed',
      handleWishlistChange,
    );


    return () => {

      cancelled = true;


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
  CLICK OUTSIDE
  ==================================================
  */

  useEffect(() => {

    function handleClickOutside(
      event,
    ) {

      if (
        headerRef.current &&
        !headerRef.current.contains(
          event.target,
        )
      ) {

        setActiveMegaMenu(null);
      }


      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(
          event.target,
        )
      ) {

        setShowSearchPopover(
          false,
        );
      }
    }


    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );


    return () => {

      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
    };

  }, []);


  /*
  ==================================================
  NAVIGATION
  ==================================================
  */

  const handleNav =
    (href) => {

      setActiveMegaMenu(null);

      setMobileDrawerOpen(false);

      setShowSearchPopover(false);


      if (onNavigate) {

        onNavigate(href);

      } else {

        window.location.hash =
          href;
      }
    };


  const toggleAccordion =
    (section) => {

      setMobileAccordion(
        mobileAccordion ===
          section
          ? null
          : section,
      );
    };


  /*
  ==================================================
  SEARCH
  ==================================================
  */

  const searchResults =
    useMemo(() => {

      if (
        !searchQuery ||
        !searchQuery.trim()
      ) {

        return [];
      }


      const lower =
        searchQuery
          .toLowerCase()
          .trim();


      return catalog.filter(
        (product) =>

          product.name
            ?.toLowerCase()
            .includes(lower) ||

          product.description
            ?.toLowerCase()
            .includes(lower) ||

          product.eyebrow
            ?.toLowerCase()
            .includes(lower) ||

          product.category
            ?.toLowerCase()
            .includes(lower) ||

          product.firmness
            ?.toLowerCase()
            .includes(lower) ||

          (
            Array.isArray(
              product.materials,
            ) &&
            product.materials.some(
              (material) =>
                material
                  ?.toLowerCase()
                  .includes(lower),
            )
          ) ||

          (
            Array.isArray(
              product.needs,
            ) &&
            product.needs.some(
              (need) =>
                need
                  ?.toLowerCase()
                  .includes(lower),
            )
          ) ||

          (
            Array.isArray(
              product.tech,
            ) &&
            product.tech.some(
              (tech) =>
                tech
                  ?.toLowerCase()
                  .includes(lower),
            )
          ) ||

          (
            Array.isArray(
              product.feels,
            ) &&
            product.feels.some(
              (feel) =>
                feel
                  ?.toLowerCase()
                  .includes(lower),
            )
          ),
      );

    }, [
      catalog,
      searchQuery,
    ]);


  const handleSearchSubmit =
    (event) => {

      if (
        event.key ===
        'Enter'
      ) {

        setShowSearchPopover(
          false,
        );

        handleNav(
          'mattresses',
        );
      }
    };


  return (

    <>

      <header
        className="somnera-header"
        ref={headerRef}
      >

        <div className="header-container container">

          {/* Brand Logo */}

          <a
            className="brand-logo"
            href="#home"
            onClick={
              (event) => {

                event.preventDefault();

                handleNav(
                  'home',
                );
              }
            }
            aria-label="Somnera Home"
          >

            <img
              src={logo}
              alt="Somnera Luxury Mattresses"
            />

          </a>


          {/* Desktop Navigation */}

          <nav className="desktop-nav">

            {/* Mattresses */}

            <div
              className={
                `nav-item ${
                  activeMegaMenu ===
                  'mattresses'
                    ? 'active'
                    : ''
                }`
              }
              onMouseEnter={
                () =>
                  setActiveMegaMenu(
                    'mattresses',
                  )
              }
              onMouseLeave={
                () =>
                  setActiveMegaMenu(
                    null,
                  )
              }
            >

              <a
                href="#mattresses"
                className="nav-link"
                onClick={
                  (event) => {

                    event.preventDefault();

                    handleNav(
                      'mattresses',
                    );
                  }
                }
              >

                Mattresses

                <span className="caret">
                  ▾
                </span>

              </a>


              {
                activeMegaMenu ===
                  'mattresses' && (

                  <MattressesMegaMenu
                    categories={
                      categories
                    }
                    onClose={
                      () =>
                        setActiveMegaMenu(
                          null,
                        )
                    }
                    onNavigate={
                      handleNav
                    }
                    onMouseEnter={
                      () =>
                        setActiveMegaMenu(
                          'mattresses',
                        )
                    }
                    onMouseLeave={
                      () =>
                        setActiveMegaMenu(
                          null,
                        )
                    }
                  />
                )
              }

            </div>


            {/* Pillows */}

            <div
              className={
                `nav-item ${
                  activeMegaMenu ===
                  'pillows'
                    ? 'active'
                    : ''
                }`
              }
              onMouseEnter={
                () =>
                  setActiveMegaMenu(
                    'pillows',
                  )
              }
              onMouseLeave={
                () =>
                  setActiveMegaMenu(
                    null,
                  )
              }
            >

              <a
                href="#pillows"
                className="nav-link"
                onClick={
                  (event) => {

                    event.preventDefault();

                    handleNav(
                      'pillows',
                    );
                  }
                }
              >

                <span className="pillows-nav-label">

                  <span>
                    Pillows
                  </span>

                    <span>
                    & Protectors
                  </span>

                </span>


                <span className="caret">
                  ▾
                </span>

              </a>


              {
                activeMegaMenu ===
                  'pillows' && (

                  <PillowsMegaMenu
                    onClose={
                      () =>
                        setActiveMegaMenu(
                          null,
                        )
                    }
                    onNavigate={
                      handleNav
                    }
                    onMouseEnter={
                      () =>
                        setActiveMegaMenu(
                          'pillows',
                        )
                    }
                    onMouseLeave={
                      () =>
                        setActiveMegaMenu(
                          null,
                        )
                    }
                  />
                )
              }

            </div>


            <div className="nav-item">

              <a
                href="#sofa-cum-bed"
                className="nav-link"
                onClick={
                  (event) => {

                    event.preventDefault();

                    handleNav(
                      'sofa-cum-bed',
                    );
                  }
                }
              >
                Sofa cum Bed
              </a>

            </div>


            <div className="nav-item">

              <a
                href="#find-showroom"
                className="nav-link"
                onClick={
                  (event) => {

                    event.preventDefault();

                    handleNav(
                      'find-showroom',
                    );
                  }
                }
              >
                Showrooms
              </a>

            </div>


            <div className="nav-item">

              <a
                href="#offers"
                className="nav-link offer-badge-link"
                onClick={
                  (event) => {

                    event.preventDefault();

                    handleNav(
                      'offers',
                    );
                  }
                }
              >

                <span className="offer-pulse-dot" />

                Offers

              </a>

            </div>


            {/* Sleep Advice */}

            <div
              className={
                `nav-item ${
                  activeMegaMenu ===
                  'advice'
                    ? 'active'
                    : ''
                }`
              }
              onMouseEnter={
                () =>
                  setActiveMegaMenu(
                    'advice',
                  )
              }
              onMouseLeave={
                () =>
                  setActiveMegaMenu(
                    null,
                  )
              }
            >

              <a
                href="#sleep-advice"
                className="nav-link"
                onClick={
                  (event) => {

                    event.preventDefault();

                    handleNav(
                      'sleep-advice',
                    );
                  }
                }
              >

                Sleep Guide

                <span className="caret">
                  ▾
                </span>

              </a>


              {
                activeMegaMenu ===
                  'advice' && (

                  <SleepAdviceDropdown
                    onClose={
                      () =>
                        setActiveMegaMenu(
                          null,
                        )
                    }
                    onNavigate={
                      handleNav
                    }
                    onMouseEnter={
                      () =>
                        setActiveMegaMenu(
                          'advice',
                        )
                    }
                    onMouseLeave={
                      () =>
                        setActiveMegaMenu(
                          null,
                        )
                    }
                  />
                )
              }

            </div>


            <div className="nav-item">

              <a
                href="#distributor"
                className="nav-link"
                onClick={
                  (event) => {

                    event.preventDefault();

                    handleNav(
                      'distributor',
                    );
                  }
                }
              >
                Distributor
              </a>

            </div>

          </nav>


          {/* Header actions */}

          <div className="header-right-actions">

            {/* Search */}

            <div
              className="header-search-container"
              ref={
                searchContainerRef
              }
            >

              <div className="header-search-bar">

                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >

                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                  />

                  <line
                    x1="21"
                    y1="21"
                    x2="16.65"
                    y2="16.65"
                  />

                </svg>


                <input
                  type="text"
                  placeholder="Search Products"
                  value={
                    searchQuery ||
                    ''
                  }
                  onFocus={
                    () =>
                      setShowSearchPopover(
                        true,
                      )
                  }
                  onChange={
                    (event) => {

                      onSearch?.(
                        event.target.value,
                      );

                      setShowSearchPopover(
                        true,
                      );
                    }
                  }
                  onKeyDown={
                    handleSearchSubmit
                  }
                />


                {
                  searchQuery && (

                    <button
                      className="search-clear-btn"
                      onClick={
                        () => {

                          onSearch?.('');

                          setShowSearchPopover(
                            false,
                          );
                        }
                      }
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )
                }

              </div>


              {
                showSearchPopover &&
                searchQuery &&
                searchQuery.trim() !==
                  '' && (

                  <div className="search-suggestions-popover">

                    <div className="search-popover-header">

                      Matching Products
                      {' '}
                      (
                      {
                        searchResults.length
                      }
                      )

                    </div>


                    {
                      searchResults.length >
                      0
                        ? (

                          <div className="search-suggestions-list">

                            {
                              searchResults
                                .slice(
                                  0,
                                  6,
                                )
                                .map(
                                  (item) => {

                                    const thicknessKeys =
                                      Object.keys(
                                        item.prices ||
                                          {},
                                      );


                                    const defaultThickness =
                                      thicknessKeys.length >
                                      0
                                        ? thicknessKeys[0]
                                        : '6';


                                    const itemPrice =
                                      getPrice(
                                        item,
                                        '72x60',
                                        defaultThickness,
                                      ) ||
                                      getMinProductPrice(
                                        item,
                                      ) ||
                                      item.price ||
                                      0;


                                    return (

                                      <div
                                        key={
                                          item.id
                                        }
                                        className="suggestion-item"
                                        onClick={
                                          () =>
                                            handleNav(
                                              `product/${item.id}`,
                                            )
                                        }
                                      >

                                        <img
                                          src={
                                            item.image
                                          }
                                          alt={
                                            item.name
                                          }
                                          className="suggestion-thumb"
                                        />


                                        <div className="suggestion-info">

                                          <span className="suggestion-title">
                                            {
                                              item.name
                                            }
                                          </span>


                                          <span className="suggestion-meta">

                                            {
                                              item.category ||
                                              item.eyebrow
                                            }

                                          </span>

                                        </div>


                                        {
                                          itemPrice >
                                          0 && (

                                            <span className="suggestion-price">

                                              ₹
                                              {
                                                itemPrice.toLocaleString(
                                                  'en-IN',
                                                )
                                              }

                                            </span>
                                          )
                                        }

                                      </div>
                                    );
                                  },
                                )
                            }

                          </div>
                        )

                        : (

                          <div className="search-no-results">
                            No products found
                          </div>
                        )
                    }

                  </div>
                )
              }

            </div>


            {/* Cart */}

            <a
              href="#cart"
              className="header-cart-btn"
              onClick={
                (event) => {

                  event.preventDefault();

                  handleNav(
                    'cart',
                  );
                }
              }
              aria-label={
                `Cart with ${cartCount} items`
              }
            >

              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >

                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />

                <line
                  x1="3"
                  y1="6"
                  x2="21"
                  y2="6"
                />

                <path d="M16 10a4 4 0 0 1-8 0" />

              </svg>


              <span className="cart-text">
                Cart
              </span>


              {
                cartCount >
                0 && (

                  <span className="cart-badge">
                    {cartCount}
                  </span>
                )
              }

            </a>


            {/* Wishlist */}

            <a
              href="#wishlist"
              className="header-wishlist-btn"
              onClick={
                (event) => {

                  event.preventDefault();


                  if (!isLoggedIn) {

                    openAuthModal(
                      'login',
                    );

                  } else {

                    handleNav(
                      'wishlist',
                    );
                  }
                }
              }
              aria-label={
                `Wishlist with ${wishlistCount} items`
              }
              title="My Wishlist"
            >

              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill={
                  wishlistCount >
                  0
                    ? '#ef4444'
                    : 'none'
                }
                stroke={
                  wishlistCount >
                  0
                    ? '#ef4444'
                    : 'currentColor'
                }
                strokeWidth="2.2"
              >

                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />

              </svg>


              {
                wishlistCount >
                0 && (

                  <span className="wishlist-badge-count">
                    {wishlistCount}
                  </span>
                )
              }

            </a>


            <div className="desktop-account-wrapper">

              <AccountDropdown
                onNavigate={
                  handleNav
                }
              />

            </div>


            {/* Mobile menu button */}

            <button
              className="mobile-hamburger-btn"
              onClick={
                () =>
                  setMobileDrawerOpen(
                    !mobileDrawerOpen,
                  )
              }
              aria-label="Toggle navigation drawer"
            >

              {
                mobileDrawerOpen
                  ? (

                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >

                      <line
                        x1="18"
                        y1="6"
                        x2="6"
                        y2="18"
                      />

                      <line
                        x1="6"
                        y1="6"
                        x2="18"
                        y2="18"
                      />

                    </svg>
                  )

                  : (

                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >

                      <line
                        x1="3"
                        y1="12"
                        x2="21"
                        y2="12"
                      />

                      <line
                        x1="3"
                        y1="6"
                        x2="21"
                        y2="6"
                      />

                      <line
                        x1="3"
                        y1="18"
                        x2="21"
                        y2="18"
                      />

                    </svg>
                  )
              }

            </button>

          </div>

        </div>


        {/* Mobile Drawer */}

        {
          mobileDrawerOpen && (

            <div className="mobile-nav-drawer">

              <div className="mobile-drawer-search">

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >

                  <circle
                    cx="11"
                    cy="11"
                    r="8"
                  />

                  <line
                    x1="21"
                    y1="21"
                    x2="16.65"
                    y2="16.65"
                  />

                </svg>


                <input
                  type="text"
                  placeholder="Search products..."
                  value={
                    searchQuery ||
                    ''
                  }
                  onChange={
                    (event) => {

                      onSearch?.(
                        event.target.value,
                      );


                      if (
                        event.target.value
                      ) {

                        handleNav(
                          'mattresses',
                        );
                      }
                    }
                  }
                />

              </div>


              <div className="mobile-drawer-menu">

                <a
                  href="#home"
                  className="mobile-link"
                  onClick={
                    (event) => {

                      event.preventDefault();

                      handleNav(
                        'home',
                      );
                    }
                  }
                >
                  🏠 Home
                </a>


                {/* Mattresses */}

                <div className="mobile-accordion">

                  <button
                    className="mobile-accordion-header"
                    onClick={
                      () =>
                        toggleAccordion(
                          'mattresses',
                        )
                    }
                  >

                    <span>
                      🛏️ Mattresses
                    </span>


                    <span
                      className={
                        `accordion-arrow ${
                          mobileAccordion ===
                          'mattresses'
                            ? 'expanded'
                            : ''
                        }`
                      }
                    >
                      ▾
                    </span>

                  </button>


                  {
                    mobileAccordion ===
                      'mattresses' && (

                      <div className="mobile-accordion-body">

                        <a
                          href="#mattresses"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'mattresses',
                              );
                            }
                          }
                        >
                          All Mattresses
                        </a>


                        <a
                          href="#mattresses?collection=Orthopaedic"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'mattresses?collection=Orthopaedic',
                              );
                            }
                          }
                        >
                          Orthopaedic Mattresses
                        </a>


                        <a
                          href="#mattresses?material=Natural+Latex"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'mattresses?material=Natural+Latex',
                              );
                            }
                          }
                        >
                          Natural Latex
                        </a>


                        <a
                          href="#mattresses?material=Impressions+Foam"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'mattresses?material=Impressions+Foam',
                              );
                            }
                          }
                        >
                          Memory Foam
                        </a>


                        <a
                          href="#mattresses?material=Pocket+Spring"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'mattresses?material=Pocket+Spring',
                              );
                            }
                          }
                        >
                          Pocket Spring
                        </a>

                      </div>
                    )
                  }

                </div>


                {/* Pillows */}

                <div className="mobile-accordion">

                  <button
                    className="mobile-accordion-header"
                    onClick={
                      () =>
                        toggleAccordion(
                          'pillows',
                        )
                    }
                  >

                    <span>
                      ☁️ Pillows & Accessories
                    </span>


                    <span
                      className={
                        `accordion-arrow ${
                          mobileAccordion ===
                          'pillows'
                            ? 'expanded'
                            : ''
                        }`
                      }
                    >
                      ▾
                    </span>

                  </button>


                  {
                    mobileAccordion ===
                      'pillows' && (

                      <div className="mobile-accordion-body">

                        <a
                          href="#pillows"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'pillows',
                              );
                            }
                          }
                        >
                          Luxury Pillows
                        </a>


                        <a
                          href="#pillows-protectors?type=protectors"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'pillows-protectors?type=protectors',
                              );
                            }
                          }
                        >
                          Waterproof Mattress Protectors
                        </a>


                        <a
                          href="#pillows-protectors?type=protectors"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'pillows-protectors?type=protectors',
                              );
                            }
                          }
                        >
                          Pillow Protectors
                        </a>

                      </div>
                    )
                  }

                </div>


                <a
                  href="#sofa-cum-bed"
                  className="mobile-link"
                  onClick={
                    (event) => {

                      event.preventDefault();

                      handleNav(
                        'sofa-cum-bed',
                      );
                    }
                  }
                >
                  🛋️ Sofa cum Bed
                </a>


                <a
                  href="#find-showroom"
                  className="mobile-link"
                  onClick={
                    (event) => {

                      event.preventDefault();

                      handleNav(
                        'find-showroom',
                      );
                    }
                  }
                >
                  📍 Find Showroom
                </a>


                <a
                  href="#offers"
                  className="mobile-link mobile-offer-link"
                  onClick={
                    (event) => {

                      event.preventDefault();

                      handleNav(
                        'offers',
                      );
                    }
                  }
                >
                  🔥 Special Offers
                </a>


                {/* Sleep Advice */}

                <div className="mobile-accordion">

                  <button
                    className="mobile-accordion-header"
                    onClick={
                      () =>
                        toggleAccordion(
                          'advice',
                        )
                    }
                  >

                    <span>
                      📘 Sleep Guide
                    </span>


                    <span
                      className={
                        `accordion-arrow ${
                          mobileAccordion ===
                          'advice'
                            ? 'expanded'
                            : ''
                        }`
                      }
                    >
                      ▾
                    </span>

                  </button>


                  {
                    mobileAccordion ===
                      'advice' && (

                      <div className="mobile-accordion-body">

                        <a
                          href="#sleep-advice"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'sleep-advice',
                              );
                            }
                          }
                        >
                          Buying Guide
                        </a>


                        <a
                          href="#sleep-advice"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'sleep-advice',
                              );
                            }
                          }
                        >
                          Firmness Selector
                        </a>


                        <a
                          href="#sleep-advice"
                          onClick={
                            (event) => {

                              event.preventDefault();

                              handleNav(
                                'sleep-advice',
                              );
                            }
                          }
                        >
                          Mattress Size Guide
                        </a>

                      </div>
                    )
                  }

                </div>


                <a
                  href="#distributor"
                  className="mobile-link"
                  onClick={
                    (event) => {

                      event.preventDefault();

                      handleNav(
                        'distributor',
                      );
                    }
                  }
                >
                  🤝 Become Our Distributor
                </a>


                <a
                  href="#wishlist"
                  className="mobile-link"
                  onClick={
                    (event) => {

                      event.preventDefault();


                      if (!isLoggedIn) {

                        setMobileDrawerOpen(
                          false,
                        );

                        openAuthModal(
                          'login',
                        );

                      } else {

                        handleNav(
                          'wishlist',
                        );
                      }
                    }
                  }
                >

                  🤍 My Wishlist

                  {
                    wishlistCount >
                    0
                      ? ` (${wishlistCount})`
                      : ''
                  }

                </a>


                <div className="mobile-account-section">

                  {
                    isLoggedIn
                      ? (

                        <div className="mobile-user-card">

                          <div className="mobile-user-avatar">

                            {
                              (
                                user?.firstName ||
                                'S'
                              )
                                .charAt(0)
                                .toUpperCase()
                            }

                          </div>


                          <div>

                            <strong>

                              {
                                user?.firstName
                              }

                              {' '}

                              {
                                user?.lastName
                              }

                            </strong>


                            <small>
                              {
                                user?.email
                              }
                            </small>

                          </div>

                        </div>
                      )

                      : (

                        <button
                          className="mobile-login-btn"
                          onClick={
                            () => {

                              setMobileDrawerOpen(
                                false,
                              );

                              openAuthModal(
                                'login',
                              );
                            }
                          }
                        >
                          Login / Sign Up
                        </button>
                      )
                  }

                </div>

              </div>

            </div>
          )
        }

      </header>


      {/* Mobile bottom dock */}

      <nav
        className="mobile-bottom-dock"
        aria-label="Mobile Bottom Navigation"
      >

        <button
          className="dock-item"
          onClick={
            () =>
              handleNav(
                'home',
              )
          }
          aria-label="Home"
        >

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >

            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />

            <polyline points="9 22 9 12 15 12 15 22" />

          </svg>

          <span>
            Home
          </span>

        </button>


        <button
          className="dock-item"
          onClick={
            () =>
              handleNav(
                'mattresses',
              )
          }
          aria-label="Shop Mattresses"
        >

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >

            <rect
              x="2"
              y="4"
              width="20"
              height="16"
              rx="2"
            />

            <path d="M6 8h12" />

            <path d="M6 12h12" />

            <path d="M6 16h8" />

          </svg>

          <span>
            Shop
          </span>

        </button>


        <button
          className="dock-item"
          onClick={
            () => {

              if (isLoggedIn) {

                handleNav(
                  'wishlist',
                );

              } else {

                openAuthModal(
                  'login',
                );
              }
            }
          }
          aria-label="Wishlist"
        >

          <div className="dock-icon-wrapper">

            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={
                wishlistCount >
                0
                  ? '#ef4444'
                  : 'none'
              }
              stroke={
                wishlistCount >
                0
                  ? '#ef4444'
                  : 'currentColor'
              }
              strokeWidth="2"
            >

              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />

            </svg>


            {
              wishlistCount >
              0 && (

                <span className="dock-badge">
                  {wishlistCount}
                </span>
              )
            }

          </div>


          <span>
            Wishlist
          </span>

        </button>


        <button
          className="dock-item dock-cart-item"
          onClick={
            () =>
              handleNav(
                'cart',
              )
          }
          aria-label={
            `Cart with ${cartCount} items`
          }
        >

          <div className="dock-icon-wrapper">

            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >

              <path d="M6 2L3 6v14a2 2 0 0 1 2 2h14a2 2 0 0 1 2-2V6l-3-4z" />

              <line
                x1="3"
                y1="6"
                x2="21"
                y2="6"
              />

              <path d="M16 10a4 4 0 0 1-8 0" />

            </svg>


            {
              cartCount >
              0 && (

                <span className="dock-badge">
                  {cartCount}
                </span>
              )
            }

          </div>


          <span>
            Cart
          </span>

        </button>


        <button
          className="dock-item"
          onClick={
            () => {

              if (isLoggedIn) {

                handleNav(
                  'profile',
                );

              } else {

                openAuthModal(
                  'login',
                );
              }
            }
          }
          aria-label="Account Profile"
        >

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >

            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />

            <circle
              cx="12"
              cy="7"
              r="4"
            />

          </svg>


          <span>

            {
              isLoggedIn
                ? 'Account'
                : 'Login'
            }

          </span>

        </button>

      </nav>

    </>
  );
}
