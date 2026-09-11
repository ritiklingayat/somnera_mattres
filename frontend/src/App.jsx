import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import Header
  from './components/Header/Header';

import Footer
  from './components/Footer/Footer';

import WhatsAppButton
  from './components/WhatsAppButton/WhatsAppButton';

import Home
  from './pages/Home';

import Storefront
  from './pages/Storefront';

import AdminPanel
  from './admin/AdminPanel';

import {
  AuthProvider,
  AuthModal,
  useAuth,
} from './components/Account';


import {
  getCategoriesApi,
  getProductsApi,
} from './services/catalogService';


import {
  CATALOG_CHANGED_EVENT,
} from './db/database';


import {
  addToCartApi,
  clearCartApi,
  getCartApi,
  removeCartItemApi,
  updateCartItemApi,
} from './services/cartService';


import {
  MattressesPage,
} from './pages/MattressesPage';

import {
  PillowsProtectorsPage,
} from './pages/PillowsProtectorsPage';

import {
  PillowsPage,
} from './pages/PillowsPage';

import {
  SofaCumBedPage,
} from './pages/SofaCumBedPage';

import {
  FindShowroomPage,
} from './pages/FindShowroomPage';

import {
  SleepAdvicePage,
} from './pages/SleepAdvicePage';

import {
  DistributorPage,
} from './pages/DistributorPage';

import {
  WishlistPage,
} from './pages/WishlistPage';

import {
  OffersPage,
} from './pages/OffersPage';

import ProductDetailPage
  from './pages/ProductDetailPage';

import ProfilePage
  from './pages/Account/ProfilePage';

import OrdersPage
  from './pages/Account/OrdersPage';

  import OrderDetailsPage
  from './pages/Account/OrderDetailsPage';


/*
==================================================
HASH ROUTING
==================================================
*/

const pageFromHash =
  () => {

    const hash =
      (
        window.location.hash ||
        '#home'
      ).replace(
        '#',
        '',
      );


    const cleanHash =
      hash.split('?')[0];


    if (
      [
        'login',
        'register',
        'forgot-password',
        'reset-password',
      ].includes(
        cleanHash,
      )
    ) {

      return 'home';
    }


    return (
      cleanHash ||
      'home'
    );
  };


/*
==================================================
CUSTOMER APPLICATION
==================================================
*/

function MainAppContent({
  cart,
  setCart,

  cartTotal,
  setCartTotal,

  cartTotalItems,
  setCartTotalItems,

  cartLoading,
  setCartLoading,

  catalog,
  setCatalog,

  categories,

  catalogLoading,
  catalogError,

  searchQuery,
  setSearchQuery,

  page,
  setPage,
}) {

  /*
  ==================================================
  AUTH
  ==================================================
  */

  const {
    isLoggedIn,
    openAuthModal,
    toastMessage,
    showToast,
  } = useAuth();


  /*
  ==================================================
  REFRESH BACKEND CART
  ==================================================

  Used after successful Razorpay verification.

  Backend clears the cart after payment succeeds,
  so frontend must fetch the latest empty cart.
  */

  const refreshCart =
    async () => {

      if (!isLoggedIn) {

        setCart([]);

        setCartTotal(0);

        setCartTotalItems(0);

        return;
      }


      try {

        const response =
          await getCartApi();


        setCart(
          response.items,
        );


        setCartTotal(
          response.cartTotal,
        );


        setCartTotalItems(
          response.totalItems,
        );


      } catch (error) {

        console.error(
          'Unable to refresh cart:',
          error,
        );
      }
    };


  /*
  ==================================================
  LOAD BACKEND CART
  ==================================================
  */

  useEffect(() => {

    let cancelled =
      false;


    const loadCart =
      async () => {

        /*
         * Cart belongs to logged-in USER.
         */

        if (!isLoggedIn) {

          setCart([]);

          setCartTotal(0);

          setCartTotalItems(0);

          setCartLoading(false);

          return;
        }


        try {

          setCartLoading(
            true,
          );


          const response =
            await getCartApi();


          if (cancelled) {
            return;
          }


          setCart(
            response.items,
          );


          setCartTotal(
            response.cartTotal,
          );


          setCartTotalItems(
            response.totalItems,
          );


        } catch (error) {

          if (!cancelled) {

            console.error(
              'Unable to load cart:',
              error,
            );
          }


        } finally {

          if (!cancelled) {

            setCartLoading(
              false,
            );
          }
        }
      };


    loadCart();


    return () => {

      cancelled =
        true;
    };

  }, [
    isLoggedIn,
    setCart,
    setCartTotal,
    setCartTotalItems,
    setCartLoading,
  ]);


  /*
  ==================================================
  SEARCH
  ==================================================
  */

  const filteredCatalog =
    useMemo(() => {

      if (!searchQuery) {

        return catalog;
      }


      const lower =
        searchQuery
          .toLowerCase();


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


  /*
  ==================================================
  NAVIGATION
  ==================================================
  */

  const changePage =
    (next) => {

      window.location.hash =
        next;


      setPage(
        next.split('?')[0],
      );


      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    };


  /*
  ==================================================
  CATALOG
  ==================================================
  */

  const updateCatalog =
    (nextCatalog) => {

      const newProducts =
        typeof nextCatalog ===
          'function'
          ? nextCatalog(
              catalog,
            )
          : nextCatalog;


      setCatalog(
        newProducts,
      );
    };


  /*
  ==================================================
  ADD TO BACKEND CART
  ==================================================
  */

  const handleAddToCart =
    async (item) => {

      /*
      ==============================================
      AUTH CHECK
      ==============================================
      */

      if (!isLoggedIn) {

        openAuthModal(
          'login',
          item,
        );


        return;
      }


      const isMattress =
        item.productType === 'MATTRESS' ||
        item.productSection === 'MATTRESS';


      const thickness = isMattress
        ? Number(item.thickness)
        : '';


      if (
        isMattress &&
        ![4, 5, 6, 8].includes(thickness)
      ) {

        showToast(
          'Please select a valid mattress thickness.',
        );


        return;
      }


      if (
        item.stock != null &&
        Number(item.stock) <= 0
      ) {
        showToast('This product is out of stock.');

        return;
      }


      const accessoryPrice = Number(
        item.offerPrice ??
        item.sellingPrice ??
        item.price,
      );


      if (
        !isMattress &&
        (!Number.isFinite(accessoryPrice) || accessoryPrice <= 0)
      ) {
        showToast('Please add a valid product price in admin first.');

        return;
      }


      try {

        const response =
          await addToCartApi({
            productId:
              item.productId ??
              item.id,

            size:
              item.size,

            thickness,

            quantity:
              Math.min(
                10,
                Math.max(1, Number(item.quantity) || 1),
              ),
          });


        setCart(
          response.items,
        );


        setCartTotal(
          response.cartTotal,
        );


        setCartTotalItems(
          response.totalItems,
        );


        showToast(
          `${item.name} added to cart!`,
        );


      } catch (error) {

        showToast(
          error.message ||
          'Unable to add product to cart.',
        );
      }
    };


  /*
  ==================================================
  REMOVE CART ITEM
  ==================================================
  */

  const handleRemoveCartItem =
    async (
      cartItemId,
    ) => {

      try {

        const response =
          await removeCartItemApi(
            cartItemId,
          );


        setCart(
          response.items,
        );


        setCartTotal(
          response.cartTotal,
        );


        setCartTotalItems(
          response.totalItems,
        );


      } catch (error) {

        showToast(
          error.message ||
          'Unable to remove cart item.',
        );
      }
    };


  /*
  ==================================================
  CLEAR CART
  ==================================================
  */

  const handleClearCart =
    async () => {

      if (
        cart.length ===
        0
      ) {

        return;
      }


      const confirmed =
        window.confirm(
          'Are you sure you want to clear your cart?',
        );


      if (!confirmed) {

        return;
      }


      try {

        const response =
          await clearCartApi();


        setCart(
          response.items,
        );


        setCartTotal(
          response.cartTotal,
        );


        setCartTotalItems(
          response.totalItems,
        );


        showToast(
          'Cart cleared successfully.',
        );


      } catch (error) {

        showToast(
          error.message ||
          'Unable to clear cart.',
        );
      }
    };


  /*
  ==================================================
  UPDATE QUANTITY
  ==================================================
  */

  const updateQuantity =
    async (
      cartItemId,
      quantity,
    ) => {

      if (
        quantity <
        1
      ) {

        return handleRemoveCartItem(
          cartItemId,
        );
      }


      if (
        quantity >
        10
      ) {

        showToast(
          'Maximum quantity allowed is 10.',
        );


        return;
      }


      try {

        const response =
          await updateCartItemApi(
            cartItemId,
            quantity,
          );


        setCart(
          response.items,
        );


        setCartTotal(
          response.cartTotal,
        );


        setCartTotalItems(
          response.totalItems,
        );


      } catch (error) {

        showToast(
          error.message ||
          'Unable to update cart quantity.',
        );
      }
    };


  /*
  ==================================================
  CART COUNT
  ==================================================
  */

  const cartCount =
    cartTotalItems;


  /*
  ==================================================
  AUTH MODAL HASHES
  ==================================================
  */

  useEffect(() => {

    const hash =
      window.location.hash
        .replace(
          '#',
          '',
        )
        .split('?')[0];


    if (
      [
        'login',
        'register',
        'forgot-password',
        'reset-password',
      ].includes(
        hash,
      )
    ) {

      openAuthModal(
        hash,
      );
    }

  }, [
    openAuthModal,
  ]);


  /*
  ==================================================
  PROTECTED CUSTOMER PAGES
  ==================================================
  */

  useEffect(() => {

    const protectedPages = [
  'profile',
  'orders',
  'checkout',
];


const isProtectedOrderDetails =
  page.startsWith(
    'order/',
  );


if (
  !isLoggedIn &&
  (
    protectedPages.includes(
      page,
    ) ||
    isProtectedOrderDetails
  )
) {

  openAuthModal(
    'login',
  );


  window.location.hash =
    'home';
}


    if (
      !isLoggedIn &&
      protectedPages.includes(
        page,
      )
    ) {

      openAuthModal(
        'login',
      );


      window.location.hash =
        'home';
    }

  }, [
    isLoggedIn,
    page,
    openAuthModal,
  ]);


  /*
  ==================================================
  CATALOG LOADING
  ==================================================
  */

  if (
    catalogLoading
  ) {

    return (

      <>

        <Header
          cartCount={
            cartCount
          }
          categories={
            categories
          }
          catalog={
            catalog
          }
          onNavigate={
            changePage
          }
          searchQuery={
            searchQuery
          }
          onSearch={
            setSearchQuery
          }
        />


        <main>

          <div
            className="container"
            style={{
              padding:
                '80px 20px',

              textAlign:
                'center',
            }}
          >
            Loading products...
          </div>

        </main>


        <Footer />

        <WhatsAppButton />

        <AuthModal />

      </>
    );
  }


  /*
  ==================================================
  CATALOG ERROR
  ==================================================
  */

  if (
    catalogError
  ) {

    return (

      <>

        <Header
          cartCount={
            cartCount
          }
          categories={
            categories
          }
          catalog={
            catalog
          }
          onNavigate={
            changePage
          }
          searchQuery={
            searchQuery
          }
          onSearch={
            setSearchQuery
          }
        />


        <main>

          <div
            className="container"
            style={{
              padding:
                '80px 20px',

              textAlign:
                'center',
            }}
          >

            <h2>
              Unable to load products
            </h2>


            <p>
              {
                catalogError
              }
            </p>

          </div>

        </main>


        <Footer />

        <WhatsAppButton />

        <AuthModal />

      </>
    );
  }


  /*
  ==================================================
  PAGE ROUTING
  ==================================================
  */

  let content;


  if (
  page ===
    'profile' &&
  isLoggedIn
) {

  content =
    <ProfilePage />;


} else if (
  page ===
    'orders' &&
  isLoggedIn
) {

  content =
    <OrdersPage />;


} else if (
  page.startsWith(
    'order/',
  ) &&
  isLoggedIn
) {

  content = (

    <OrderDetailsPage
      orderId={
        page.replace(
          'order/',
          '',
        )
      }
    />
  );


  } else if (
    page ===
      'products' ||
    page ===
      'mattresses'
  ) {

    content = (

      <MattressesPage
        products={
          filteredCatalog.filter(
            (product) =>
              !product.productSection ||
              product.productSection ===
                'MATTRESS',
          )
        }
        addToCart={
          handleAddToCart
        }
      />
    );


  } else if (
    page ===
    'pillows'
  ) {

    content = (

      <PillowsPage
        products={catalog}
      />
    );


  } else if (
    page ===
    'pillows-protectors'
  ) {

    content = (

      <PillowsProtectorsPage
        products={
          catalog.filter(
            (product) =>
              product.productType ===
                'PROTECTOR' ||
              product.productSection ===
                'PILLOWS_ACCESSORIES',
          )
        }
        addToCart={
          handleAddToCart
        }
      />
    );


  } else if (
    page ===
    'sofa-cum-bed'
  ) {

    content = (

      <SofaCumBedPage
        products={
          catalog.filter(
            (product) =>
              product.productSection ===
              'SOFA_CUM_BED',
          )
        }
        addToCart={
          handleAddToCart
        }
      />
    );


  } else if (
    page ===
    'find-showroom'
  ) {

    content =
      <FindShowroomPage />;


  } else if (
    page ===
    'sleep-advice'
  ) {

    content =
      <SleepAdvicePage />;


  } else if (
    page ===
    'distributor'
  ) {

    content =
      <DistributorPage />;


  } else if (
    page ===
    'wishlist'
  ) {

    content = (

      <WishlistPage
        onNavigate={
          changePage
        }
        addToCart={
          handleAddToCart
        }
      />
    );


  } else if (
    page ===
    'offers'
  ) {

    content = (

      <OffersPage
        onNavigate={
          changePage
        }
      />
    );


  } else if (
    page.startsWith(
      'product/',
    )
  ) {

    content = (

      <ProductDetailPage
        id={
          page.replace(
            'product/',
            '',
          )
        }
        products={
          catalog
        }
        addToCart={
          handleAddToCart
        }
      />
    );


  /*
  ==================================================
  ABOUT
  ==================================================
  */

  } else if (
    page ===
    'about'
  ) {

    content = (

      <Storefront
  view="about"
  onNavigate={changePage}
/>
    );


  /*
  ==================================================
  GALLERY
  ==================================================
  */

  } else if (
    page ===
    'gallery'
  ) {

    content = (

      <Storefront
        view="gallery"
        products={
          catalog
        }
      />
    );


  /*
  ==================================================
  WARRANTY
  ==================================================
  */

  } else if (
    page ===
    'warranty'
  ) {

    content = (

      <Storefront
        view="warranty"
        onNavigate={
          changePage
        }
      />
    );


  /*
  ==================================================
  CONTACT
  ==================================================
  */

  } else if (
    page ===
    'contact'
  ) {

    content = (

      <Storefront
        view="contact"
      />
    );


  /*
  ==================================================
  CART
  ==================================================
  */

  } else if (
    page ===
    'cart'
  ) {

    content = (

      <Storefront
        view="cart"

        cart={
          cart
        }

        cartTotal={
          cartTotal
        }

        cartLoading={
          cartLoading
        }

        updateQuantity={
          updateQuantity
        }

        removeCartItem={
          handleRemoveCartItem
        }

        clearCart={
          handleClearCart
        }

        onNavigate={
          changePage
        }
      />
    );


  /*
  ==================================================
  CHECKOUT + RAZORPAY
  ==================================================
  */

  } else if (
    page ===
    'checkout'
  ) {

    content = (

      <Storefront
        view="checkout"

        cart={
          cart
        }

        cartTotal={
          cartTotal
        }

        onPaymentSuccess={
          refreshCart
        }

        onNavigate={
          changePage
        }
      />
    );


  /*
  ==================================================
  LEGACY ADMIN ROUTE
  ==================================================
  */

  } else if (
    page ===
    'admin'
  ) {

    content = (

      <Storefront
        view="admin"
        products={
          catalog
        }
        setProducts={
          updateCatalog
        }
      />
    );


  /*
  ==================================================
  HOME
  ==================================================
  */

  } else {

    content = (

      <Home
        products={
          catalog
        }

        categories={
          categories
        }

        onBrowse={
          () =>
            changePage(
              'mattresses',
            )
        }

        onNavigate={
          changePage
        }

        onAddToCart={
          handleAddToCart
        }
      />
    );
  }


  /*
  ==================================================
  APPLICATION UI
  ==================================================
  */

  return (

    <>

      <Header
        cartCount={
          cartCount
        }
        categories={
          categories
        }
        catalog={
          catalog
        }
        onNavigate={
          changePage
        }
        searchQuery={
          searchQuery
        }
        onSearch={
          setSearchQuery
        }
      />


      <main>
        {content}
      </main>


      <Footer />

      <WhatsAppButton />


      <AuthModal />


      {
        toastMessage && (

          <div className="somnera-toast-notification">

            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#241132"
              strokeWidth="2.5"
            >

              <polyline points="20 6 9 17 4 12" />

            </svg>


            <span>
              {
                toastMessage
              }
            </span>

          </div>
        )
      }

    </>
  );
}


/*
==================================================
ROOT APP
==================================================
*/

export default function App() {

  /*
  ==================================================
  ROUTING
  ==================================================
  */

  const [
    page,
    setPage,
  ] = useState(
    pageFromHash(),
  );


  /*
  ==================================================
  BACKEND CART STATE
  ==================================================
  */

  const [
    cart,
    setCart,
  ] = useState([]);


  const [
    cartTotal,
    setCartTotal,
  ] = useState(0);


  const [
    cartTotalItems,
    setCartTotalItems,
  ] = useState(0);


  const [
    cartLoading,
    setCartLoading,
  ] = useState(false);


  /*
  ==================================================
  CATALOG STATE
  ==================================================
  */

  const [
    catalog,
    setCatalog,
  ] = useState([]);


  const [
    categories,
    setCategories,
  ] = useState([]);


  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(true);


  const [
    catalogError,
    setCatalogError,
  ] = useState('');


  /*
  ==================================================
  SEARCH
  ==================================================
  */

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');


  /*
  ==================================================
  ADMIN
  ==================================================
  */

  const [
    adminLoggedIn,
    setAdminLoggedIn,
  ] = useState(
    () =>
      sessionStorage.getItem(
        'somnera-admin',
      ) === 'true',
  );


  /*
  ==================================================
  LOAD CATALOG
  ==================================================
  */

  useEffect(() => {

    let cancelled =
      false;


    const loadCatalog =
      async () => {

        try {

          setCatalogLoading(
            true,
          );


          setCatalogError('');


          const [
            productsData,
            categoriesData,
          ] =
            await Promise.all([
              getProductsApi(),
              getCategoriesApi(),
            ]);


          if (cancelled) {

            return;
          }


          setCatalog(
            productsData.filter(
              (product) =>
                product.isActive !== false,
            ),
          );


          setCategories(
            categoriesData,
          );


        } catch (error) {

          if (cancelled) {

            return;
          }


          console.error(
            'Unable to load product catalog:',
            error,
          );


          setCatalog([]);

          setCategories([]);


          setCatalogError(
            error.message ||
            'Unable to load products. Please try again.',
          );


        } finally {

          if (!cancelled) {

            setCatalogLoading(
              false,
            );
          }
        }
      };


    loadCatalog();

    window.addEventListener(
      CATALOG_CHANGED_EVENT,
      loadCatalog,
    );


    return () => {

      cancelled =
        true;

      window.removeEventListener(
        CATALOG_CHANGED_EVENT,
        loadCatalog,
      );
    };

  }, []);


  /*
  ==================================================
  HASH LISTENER
  ==================================================
  */

  useEffect(() => {

    const syncHash = () => {
      setPage(pageFromHash());
    };

    window.addEventListener('hashchange', syncHash);

    return () => {
      window.removeEventListener('hashchange', syncHash);
    };
  }, []);

  /*
  ==================================================
  ADMIN APPLICATION
  ==================================================
  */

  if (
    window.location.pathname.startsWith('/admin') ||
    page === 'admin' ||
    window.location.hash.startsWith('#admin') ||
    window.location.hash.startsWith('#/admin')
  ) {
    return (
      <AdminPanel
        loggedIn={adminLoggedIn}
        onLogin={() => {
          sessionStorage.setItem('somnera-admin', 'true');
          setAdminLoggedIn(true);
        }}
        onLogout={() => {
          sessionStorage.removeItem('somnera-admin');
          localStorage.removeItem('somnera_auth_token');
          localStorage.removeItem('somnera_auth_user');
          setAdminLoggedIn(false);
          if (window.location.hash.startsWith('#admin')) {
            window.location.hash = '#home';
          }
        }}
      />
    );
  }

  /*
  ==================================================
  */

  const handleAddToCartSuccess =
    async (item) => {

      const isMattress =
        item?.productType === 'MATTRESS' ||
        item?.productSection === 'MATTRESS';


      const thickness = isMattress
        ? Number(item?.thickness)
        : '';


      if (
        isMattress &&
        ![
          4,
          5,
          6,
          8,
        ].includes(
          thickness,
        )
      ) {

        console.error(
          'Unable to resume cart action: invalid thickness.',
        );


        return;
      }


      try {

        const response =
          await addToCartApi({
            productId:
              item.productId ??
              item.id,

            size:
              item.size,

            thickness,

            quantity:
              Math.min(
                10,
                Math.max(1, Number(item.quantity) || 1),
              ),
          });


        setCart(
          response.items,
        );


        setCartTotal(
          response.cartTotal,
        );


        setCartTotalItems(
          response.totalItems,
        );


      } catch (error) {

        console.error(
          'Unable to resume pending cart action:',
          error,
        );
      }
    };


  /*
  ==================================================
  CUSTOMER APPLICATION PROVIDER
  ==================================================
  */

  return (

    <AuthProvider
      onAddToCartSuccess={
        handleAddToCartSuccess
      }
    >

      <MainAppContent
        cart={
          cart
        }

        setCart={
          setCart
        }


        cartTotal={
          cartTotal
        }

        setCartTotal={
          setCartTotal
        }


        cartTotalItems={
          cartTotalItems
        }

        setCartTotalItems={
          setCartTotalItems
        }


        cartLoading={
          cartLoading
        }

        setCartLoading={
          setCartLoading
        }


        catalog={
          catalog
        }

        setCatalog={
          setCatalog
        }


        categories={
          categories
        }


        searchQuery={
          searchQuery
        }

        setSearchQuery={
          setSearchQuery
        }


        page={
          page
        }

        setPage={
          setPage
        }


        catalogLoading={
          catalogLoading
        }

        catalogError={
          catalogError
        }
      />

    </AuthProvider>
  );
}
