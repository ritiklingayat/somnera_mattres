import { useState } from 'react';
import LeadsPage from './pages/LeadsPage';
import CouponsPage from './pages/CouponsPage';
import OffersBannersPage from './pages/OffersBannersPage';
import AdminLayout from './layouts/AdminLayout';
import useAdminRoute from './hooks/useAdminRoute';
import AdminLoginPage from './pages/AdminLoginPage';
import OverviewPage from './pages/OverviewPage';
import OrdersPage from './pages/OrdersPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import ShowroomsPage from './pages/ShowroomsPage';
import CustomersPage from './pages/CustomersPage';
import ReviewsPage from './pages/ReviewsPage';
import './AdminPanel.css';

export default function AdminPanel({
  loggedIn,
  onLogin,
  onLogout,
}) {

  /*
  ================================================
  ADMIN ROUTING
  ================================================
  */

  const [
    route,
    navigate,
  ] =
    useAdminRoute();


  /*
  ================================================
  LOGIN
  ================================================
  */

  if (
    !loggedIn
  ) {

    return (

      <AdminLoginPage
        onLogin={
          onLogin
        }
      />
    );
  }


  /*
  ================================================
  PAGE ROUTING
  ================================================
  */

  let page;


  /*
  --------------------------------
  OVERVIEW
  --------------------------------
  */

  if (
    route ===
    'overview'
  ) {

    page = (

      <OverviewPage
        onNavigate={
          navigate
        }
      />
    );
  }


  /*
  --------------------------------
  ORDERS
  --------------------------------
  */

  else if (
    route ===
    'orders'
  ) {

    page = (

      <OrdersPage />
    );
  }


  /*
  --------------------------------
  PRODUCTS
  --------------------------------
  */

  else if (
    route ===
    'products'
  ) {

    page = (

      <ProductsPage />
    );
  }


  /*
  --------------------------------
  CATEGORIES
  --------------------------------
  */

  else if (
    route ===
    'categories'
  ) {

    page = (

      <CategoriesPage />
    );
  }


  else if (
    route ===
    'showrooms'
  ) {

    page = (

      <ShowroomsPage />
    );
  }


  /*
  --------------------------------
  CUSTOMERS
  --------------------------------
  */

  else if (
    route ===
    'customers'
  ) {

    page = (

      <CustomersPage />
    );
  }


  /*
  --------------------------------
  COUPONS
  --------------------------------

  Local coupon management.
  */

  else if (
    route ===
    'coupons'
  ) {

    page = (

      <CouponsPage />
    );
  }


  /*
  --------------------------------
  LEADS
  --------------------------------
  */

  else if (
    route ===
    'leads'
  ) {

    page = (

      <LeadsPage />
    );
  }


  /*
  --------------------------------
  REVIEWS
  --------------------------------
  */

  else if (
    route ===
    'reviews'
  ) {

    page = (

      <ReviewsPage />
    );
  }


  /*
  --------------------------------
  DEFAULT / FALLBACK
  --------------------------------
  */

  else {

    page = (

      <OverviewPage
        onNavigate={
          navigate
        }
      />
    );
  }


  /*
  ================================================
  ADMIN LAYOUT
  ================================================
  */

  return (

    <AdminLayout
      activeRoute={
        route
      }

      onNavigate={
        navigate
      }

      onLogout={
        onLogout
      }
    >

      {
        page
      }

    </AdminLayout>
  );
}
