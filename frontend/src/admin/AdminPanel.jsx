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
import ModulePage from './pages/ModulePage';
import { moduleConfig } from './data/seedData';
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
  TEMPORARY GENERIC MODULES
  ================================================

  Real backend pages:
  - Orders
  - Products
  - Categories
  - Customers
  - Leads
  - Coupons

  Temporary frontend-only:
  - Reviews
  - Settings
  ================================================
  */

  const [
    genericModules,
    setGenericModules,
  ] = useState({

    reviews: [],

    settings: [],
  });


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
  GENERIC MODULE HANDLERS
  ================================================
  */

  const addRecord =
    (
      moduleName,
      record,
    ) => {

      setGenericModules(
        (current) => ({

          ...current,

          [moduleName]: [
            ...(
              current[
                moduleName
              ] ||
              []
            ),

            record,
          ],
        }),
      );
    };


  const updateRecord =
    (
      moduleName,
      record,
    ) => {

      setGenericModules(
        (current) => ({

          ...current,

          [moduleName]:
            (
              current[
                moduleName
              ] ||
              []
            ).map(
              (existingRecord) =>
                existingRecord.id ===
                  record.id
                  ? record
                  : existingRecord,
            ),
        }),
      );
    };


  const deleteRecord =
    (
      moduleName,
      id,
    ) => {

      setGenericModules(
        (current) => ({

          ...current,

          [moduleName]:
            (
              current[
                moduleName
              ] ||
              []
            ).filter(
              (record) =>
                record.id !==
                id,
            ),
        }),
      );
    };


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
  GENERIC MODULES
  --------------------------------

  reviews
  settings
  */

  else {

    const activeModule =
      moduleConfig[
        route
      ]
        ? route
        : 'settings';


    const activeConfig =
      moduleConfig[
        route
      ] ||
      moduleConfig.settings;


    page = (

      <ModulePage
        key={
          activeModule
        }

        config={
          activeConfig
        }

        records={
          genericModules[
            activeModule
          ] ||
          []
        }

        onAdd={
          (record) =>
            addRecord(
              activeModule,
              record,
            )
        }

        onUpdate={
          (record) =>
            updateRecord(
              activeModule,
              record,
            )
        }

        onDelete={
          (id) =>
            deleteRecord(
              activeModule,
              id,
            )
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
