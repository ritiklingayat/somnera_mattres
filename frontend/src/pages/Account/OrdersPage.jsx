import {
  useEffect,
  useState,
} from 'react';

import {
  getMyOrdersApi,
} from '../../components/Account/authService';

import LoadingSpinner
  from '../../components/LoadingSpinner/LoadingSpinner';

import AccountLayout
  from './AccountLayout';


/*
==================================================
STATUS LABEL
==================================================
*/

const labelStatus =
  (status = '') => {

    return String(
      status,
    )
      .replaceAll(
        '_',
        ' ',
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      );
  };


/*
==================================================
BACKEND ORDER STATUS STEPS
==================================================

Backend OrderStatus:

PENDING_PAYMENT
CONFIRMED
PROCESSING
SHIPPED
DELIVERED
CANCELLED

CANCELLED is handled separately.
==================================================
*/

const ORDER_STEPS = [
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];


/*
==================================================
ORDER TRACKER
==================================================
*/

function OrderTracker({
  status,
}) {

  const normalized =
    String(
      status || '',
    )
      .toUpperCase()
      .replaceAll(
        ' ',
        '_',
      );


  if (
    normalized ===
    'CANCELLED'
  ) {

    return (

      <div
        style={{
          marginTop:
            '16px',

          padding:
            '10px 14px',

          borderRadius:
            '8px',

          background:
            '#fff1f2',

          color:
            '#be123c',

          fontWeight:
            700,
        }}
      >
        Order Cancelled
      </div>
    );
  }


  if (
    normalized ===
    'PENDING_PAYMENT'
  ) {

    return (

      <div
        style={{
          marginTop:
            '16px',

          padding:
            '10px 14px',

          borderRadius:
            '8px',

          background:
            '#fff7ed',

          color:
            '#9a3412',

          fontWeight:
            700,
        }}
      >
        Payment Pending
      </div>
    );
  }


  if (
    !ORDER_STEPS.includes(
      normalized,
    )
  ) {

    return null;
  }


  const current =
    ORDER_STEPS.indexOf(
      normalized,
    );


  return (

    <ol
      className="order-tracker"
      aria-label={
        `Order status: ${labelStatus(
          normalized,
        )}`
      }
    >

      {
        ORDER_STEPS.map(
          (
            step,
            index,
          ) => (

            <li
              key={
                step
              }
              className={
                index <= current
                  ? 'is-complete'
                  : ''
              }
            >

              <span
                aria-hidden="true"
              />


              <small>
                {
                  labelStatus(
                    step,
                  )
                }
              </small>

            </li>
          ),
        )
      }

    </ol>
  );
}


/*
==================================================
DATE
==================================================
*/

function formatDate(
  value,
) {

  if (!value) {

    return '—';
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {

    return value;
  }


  return date.toLocaleString(
    'en-IN',
    {
      day:
        'numeric',

      month:
        'long',

      year:
        'numeric',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  );
}


/*
==================================================
MONEY
==================================================
*/

function formatMoney(
  amount,
) {

  return Number(
    amount ||
    0,
  ).toLocaleString(
    'en-IN',
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
    },
  );
}


/*
==================================================
ORDERS PAGE
==================================================
*/

export default function OrdersPage() {

  const [
    orders,
    setOrders,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState('');


  /*
  ==================================================
  LOAD ORDERS
  ==================================================
  */

  useEffect(() => {

    let active =
      true;


    const loadOrders =
      async () => {

        try {

          setLoading(
            true,
          );


          setError('');


          const result =
            await getMyOrdersApi();


          if (!active) {

            return;
          }


          setOrders(
            Array.isArray(
              result,
            )
              ? result
              : [],
          );


        } catch (error) {

          if (
            active
          ) {

            setError(
              error.message ||
              'Unable to load your orders. Please try again.',
            );
          }


        } finally {

          if (
            active
          ) {

            setLoading(
              false,
            );
          }
        }
      };


    loadOrders();


    return () => {

      active =
        false;
    };

  }, []);


  /*
  ==================================================
  UI
  ==================================================
  */

  return (

    <AccountLayout
      active="orders"
    >

      <div className="account-card">

        <p className="account-kicker">
          MY ORDERS
        </p>


        <h1>
          Order History
        </h1>


        <p className="account-card-sub">
          Track and review everything you've ordered.
        </p>


        {
          loading
            ? (

              <LoadingSpinner
                label="Loading your orders..."
              />
            )

            : error
              ? (

                <div
                  className="account-error"
                  role="alert"
                >

                  <strong>
                    Unable to load orders
                  </strong>


                  <p>
                    {error}
                  </p>

                </div>
              )

              : orders.length ===
                0
                ? (

                  <div className="account-empty">

                    <p>
                      You haven't placed any orders yet.
                    </p>


                    <a
                      href="#mattresses"
                      className="account-submit-btn"
                    >
                      Start Shopping
                    </a>

                  </div>
                )

                : (

                  <div className="orders-list">

                    {
                      orders.map(
                        (order) => {

                          const items =
                            Array.isArray(
                              order.items,
                            )
                              ? order.items
                              : [];


                          const orderId =
                            order.id;


                          return (

                            <article
                              className="order-item"
                              key={
                                orderId
                              }
                            >

                              {/* HEADER */}

                              <header className="order-item__header">

                                <div>

                                  <small>
                                    Order ID
                                  </small>


                                  <strong>
                                    #
                                    {
                                      orderId
                                    }
                                  </strong>

                                </div>


                                <div>

                                  <small>
                                    Ordered On
                                  </small>


                                  <strong>
                                    {
                                      formatDate(
                                        order.createdAt,
                                      )
                                    }
                                  </strong>

                                </div>


                                <div>

                                  <small>
                                    Order Status
                                  </small>


                                  <span
                                    className={
                                      `order-status status-${String(
                                        order.orderStatus ||
                                        '',
                                      )
                                        .toLowerCase()
                                        .replaceAll(
                                          '_',
                                          '-',
                                        )}`
                                    }
                                  >

                                    {
                                      labelStatus(
                                        order.orderStatus,
                                      )
                                    }

                                  </span>

                                </div>


                                <div>

                                  <small>
                                    Payment
                                  </small>


                                  <span
                                    className={
                                      `order-status status-${String(
                                        order.paymentStatus ||
                                        '',
                                      ).toLowerCase()}`
                                    }
                                  >

                                    {
                                      labelStatus(
                                        order.paymentStatus,
                                      )
                                    }

                                  </span>

                                </div>

                              </header>


                              <OrderTracker
                                status={
                                  order.orderStatus
                                }
                              />


                              {/* ITEMS */}

                              {
                                items.map(
                                  (
                                    item,
                                    index,
                                  ) => (

                                    <div
                                      className="order-product"
                                      key={
                                        item.id ||
                                        `${orderId}-${index}`
                                      }
                                    >

                                      {
                                        item.imageUrl && (

                                          <img
                                            src={
                                              item.imageUrl
                                            }
                                            alt={
                                              item.productName ||
                                              'Ordered product'
                                            }
                                          />
                                        )
                                      }


                                      <div>

                                        <strong>
                                          {
                                            item.productName
                                          }
                                        </strong>


                                        {
                                          item.categoryName && (

                                            <small>

                                              {
                                                item.categoryName
                                              }

                                              {
                                                item.subCategoryName
                                                  ? ` · ${item.subCategoryName}`
                                                  : ''
                                              }

                                            </small>
                                          )
                                        }


                                        {
                                          item.thickness && (

                                            <small>

                                              Thickness:
                                              {' '}

                                              {
                                                item.thickness
                                              }

                                              &quot;

                                            </small>
                                          )
                                        }

                                      </div>


                                      <div>

                                        <strong>

                                          ₹
                                          {
                                            formatMoney(
                                              item.itemTotal,
                                            )
                                          }

                                        </strong>


                                        <small>

                                          ₹
                                          {
                                            formatMoney(
                                              item.unitPrice,
                                            )
                                          }

                                          {' × '}

                                          {
                                            item.quantity
                                          }

                                          {
                                            item.productType === 'PILLOW'
                                              ? ` ${item.quantity === 1 ? 'pack' : 'packs'} (${Number(item.packSize) === 2 ? '2 pillows per pack' : '1 pillow per pack'})`
                                              : ''
                                          }

                                        </small>

                                      </div>

                                    </div>
                                  ),
                                )
                              }


                              {/* FOOTER */}

                              <footer className="order-item__footer">

                                {
                                  order.paymentMethod && (

                                    <span>

                                      Payment Method:
                                      {' '}

                                      <strong>
                                        {
                                          labelStatus(
                                            order.paymentMethod,
                                          )
                                        }
                                      </strong>

                                    </span>
                                  )
                                }


                                <span>

                                  Total:
                                  {' '}

                                  <strong>

                                    ₹
                                    {
                                      formatMoney(
                                        order.totalAmount,
                                      )
                                    }

                                  </strong>

                                </span>


                                <button
                                  type="button"
                                  className="account-submit-btn"
                                  onClick={
                                    () => {

                                      window.location.hash =
                                        `order/${orderId}`;


                                      window.scrollTo({
                                        top: 0,
                                        behavior:
                                          'smooth',
                                      });
                                    }
                                  }
                                >
                                  View Details
                                </button>

                              </footer>

                            </article>
                          );
                        },
                      )
                    }

                  </div>
                )
        }

      </div>

    </AccountLayout>
  );
}
