import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAdminOrdersApi,
  updateAdminOrderStatusApi,
} from '../services/adminService';

import {
  printOrderReceipt,
  isOrderPaid,
} from '../../utils/receiptGenerator';


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


const formatMoney =
  (amount) => {

    return Number(
      amount ||
      0,
    ).toLocaleString(
      'en-IN',
      {
        maximumFractionDigits:
          2,
      },
    );
  };


const formatDate =
  (value) => {

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
          'short',

        year:
          'numeric',

        hour:
          '2-digit',

        minute:
          '2-digit',
      },
    );
  };


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


  const [
    query,
    setQuery,
  ] = useState('');


  const [
    filter,
    setFilter,
  ] = useState(
    'ALL',
  );

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] = useState(null);

  const [
    feedback,
    setFeedback,
  ] = useState(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [feedback]);


  /*
  ================================================
  LOAD ALL ADMIN ORDERS
  ================================================
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
            await getAdminOrdersApi();


          if (
            active
          ) {

            setOrders(
              result,
            );
          }


        } catch (error) {

          if (
            active
          ) {

            setError(
              error.message ||
              'Unable to load orders.',
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
  ================================================
  SEARCH + FILTER
  ================================================
  */

  const matchingOrders =
    useMemo(() => {

      const search =
        query
          .trim()
          .toLowerCase();


      return orders.filter(
        (order) => {

          const matchesStatus =
            filter ===
              'ALL' ||
            String(
              order.orderStatus ||
              '',
            ).toUpperCase() ===
              filter;


          if (
            !matchesStatus
          ) {

            return false;
          }


          if (
            !search
          ) {

            return true;
          }


          const products =
            Array.isArray(
              order.items,
            )
              ? order.items
                  .map(
                    (item) =>
                      item.productName ||
                      '',
                  )
                  .join(' ')
              : '';


          const searchable =
            `
              ${order.id || ''}
              ${order.fullName || ''}
              ${order.email || ''}
              ${order.mobile || ''}
              ${order.orderStatus || ''}
              ${order.paymentStatus || ''}
              ${products}
            `
              .toLowerCase();


          return searchable.includes(
            search,
          );
        },
      );

    }, [
      orders,
      query,
      filter,
    ]);


  /*
  ================================================
  STATUS UPDATE ACTION
  ================================================
  */

  const handleStatusChange = async (orderId, newStatus) => {
    if (!newStatus) return;
    try {
      setUpdatingOrderId(orderId);
      setFeedback(null);
      const updated = await updateAdminOrderStatusApi(orderId, newStatus);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, ...updated, orderStatus: newStatus }
            : order,
        ),
      );
      setFeedback({
        type: 'success',
        message: `Order #${orderId} status successfully updated to ${labelStatus(newStatus)}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update order status. Please try again.',
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /*
  ================================================
  GENERATE RECEIPT HTML & PRINT RECEIPT
  ================================================
  */

  const printInvoice = (order) => {
    if (!isOrderPaid(order)) return;
    printOrderReceipt(order);
  };


  return (

    <>

      <div className="admin-title">

        <div>

          <p>
            Order management
          </p>


          <h1>
            Orders
          </h1>

        </div>


        <div
          style={{
            fontWeight:
              700,
          }}
        >

          Total Orders:
          {' '}

          {
            orders.length
          }

        </div>

      </div>


      <section className="admin-card">

        {feedback && (
          <div
            className={`admin-feedback-banner ${feedback.type === 'error' ? 'is-error' : 'is-success'}`}
            role="status"
            aria-live="polite"
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              className="admin-feedback-close"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <div className="order-toolbar">

          <input
            type="search"
            value={
              query
            }
            onChange={
              (event) =>
                setQuery(
                  event.target.value,
                )
            }
            placeholder="Search order, customer, email or product"
          />


          <div>

            {
              [
                [
                  'ALL',
                  'All',
                ],

                [
                  'PENDING_PAYMENT',
                  'Pending',
                ],

                [
                  'CONFIRMED',
                  'Confirmed',
                ],

                [
                  'PROCESSING',
                  'Processing',
                ],

                [
                  'SHIPPED',
                  'Shipped',
                ],

                [
                  'DELIVERED',
                  'Delivered',
                ],

                [
                  'CANCELLED',
                  'Cancelled',
                ],
              ].map(
                ([
                  value,
                  label,
                ]) => (

                  <button
                    type="button"
                    key={
                      value
                    }
                    className={
                      filter ===
                        value
                        ? 'active-filter'
                        : ''
                    }
                    onClick={
                      () =>
                        setFilter(
                          value,
                        )
                    }
                  >
                    {
                      label
                    }
                  </button>
                ),
              )
            }

          </div>

        </div>


        {
          loading
            ? (

              <div
                style={{
                  padding:
                    '40px',

                  textAlign:
                    'center',
                }}
              >
                Loading orders...
              </div>
            )

            : error
              ? (

                <div
                  style={{
                    padding:
                      '40px',

                    textAlign:
                      'center',
                  }}
                >

                  <strong>
                    Unable to load orders
                  </strong>


                  <p>
                    {
                      error
                    }
                  </p>

                </div>
              )

              : matchingOrders.length ===
                0
                ? (

                  <div
                    style={{
                      padding:
                        '40px',

                      textAlign:
                        'center',
                    }}
                  >

                    <h2>
                      No orders found
                    </h2>

                  </div>
                )

                : (

                  <div className="order-table">

                    <div className="table-head order-table-head">

                      <span>
                        Order
                      </span>

                      <span>
                        Customer
                      </span>

                      <span>
                        Amount
                      </span>

                      <span>
                        Status
                      </span>

                      <span>
                        Receipt
                      </span>

                      <span>
                        Actions
                      </span>

                    </div>


                    {
                      matchingOrders.map(
                        (order) => {

                          const items =
                            Array.isArray(
                              order.items,
                            )
                              ? order.items
                              : [];


                          const productText =
                            items.length >
                              0
                              ? items
                                  .map(
                                    (item) =>
                                      item.productName,
                                  )
                                  .filter(
                                    Boolean,
                                  )
                                  .join(', ')
                              : 'No products';


                          return (

                            <div
                              className="table-row order-table-row"
                              key={
                                order.id
                              }
                            >

                              <span>

                                <b>

                                  #
                                  {
                                    order.id
                                  }

                                </b>


                                <small>

                                  {
                                    formatDate(
                                      order.createdAt,
                                    )
                                  }

                                </small>

                              </span>


                              <span>

                                <b>
                                  {
                                    order.fullName || 'Customer'
                                  }
                                </b>


                                <small>
                                  {
                                    order.email || '—'
                                  }
                                </small>


                                <small>
                                  {
                                    productText
                                  }
                                </small>

                              </span>


                              <strong>

                                ₹
                                {
                                  formatMoney(
                                    order.totalAmount,
                                  )
                                }

                              </strong>


                              <span>

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


                                <small>

                                  Payment:
                                  {' '}

                                  {
                                    labelStatus(
                                      order.paymentStatus,
                                    )
                                  }

                                </small>

                              </span>


                              <span className="receipt-col">
                                {
                                  isOrderPaid(order) ? (
                                    <button
                                      type="button"
                                      className="admin-print-btn"
                                      onClick={() => printInvoice(order)}
                                      title={`Print receipt for order #${order.id}`}
                                    >
                                      Print
                                    </button>
                                  ) : (
                                    <span className="receipt-unavailable" title="Receipt unavailable until payment is confirmed">
                                      —
                                    </span>
                                  )
                                }
                              </span>


                              <span className="row-actions">

                                <select
                                  className="admin-status-select"
                                  value={
                                    ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(
                                      order.orderStatus,
                                    )
                                      ? order.orderStatus
                                      : ''
                                  }
                                  onChange={
                                    (event) =>
                                      handleStatusChange(
                                        order.id,
                                        event.target.value,
                                      )
                                  }
                                  disabled={
                                    updatingOrderId ===
                                    order.id
                                  }
                                  aria-label={`Change status for order ${order.id}`}
                                >

                                  <option
                                    value=""
                                    disabled
                                  >
                                    {
                                      order.orderStatus ===
                                      'CONFIRMED'
                                        ? 'Update Status'
                                        : 'Change Status'
                                    }
                                  </option>

                                  <option value="PROCESSING">
                                    PROCESSING
                                  </option>

                                  <option value="SHIPPED">
                                    SHIPPED
                                  </option>

                                  <option value="DELIVERED">
                                    DELIVERED
                                  </option>

                                </select>

                              </span>

                            </div>
                          );
                        },
                      )
                    }

                  </div>
                )
        }

      </section>

    </>
  );
}
