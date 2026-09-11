import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAdminOrdersApi,
} from '../services/adminService';


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
  PRINT ORDER
  ================================================
  */

  const printInvoice =
    (order) => {

      const invoice =
        window.open(
          '',
          '_blank',
        );


      if (!invoice) {

        return;
      }


      const products =
        Array.isArray(
          order.items,
        )
          ? order.items
              .map(
                (item) =>
                  `
                    <p>
                      ${item.productName || 'Product'}
                      × ${item.quantity || 0}
                      ${item.productType === 'PILLOW' ? ` ${Number(item.quantity || 0) === 1 ? 'pack' : 'packs'} (${Number(item.packSize) === 2 ? '2 pillows per pack' : '1 pillow per pack'})` : ''}
                      ${
                        item.thickness
                          ? ` · ${item.thickness}" thickness`
                          : ''
                      }
                      — ₹${formatMoney(item.itemTotal)}
                    </p>
                  `,
              )
              .join('')
          : '';


      invoice.document.write(
        `
          <title>Order #${order.id}</title>

          <main style="font-family:Arial;padding:48px">

            <h1>Somnera Mattress & Foam</h1>

            <h2>Order #${order.id}</h2>

            <p>
              <b>Customer:</b>
              ${order.fullName || ''}
            </p>

            <p>
              ${order.email || ''}
            </p>

            <p>
              ${order.mobile || ''}
            </p>

            <hr />

            ${products}

            <hr />

            <h2>
              Total ₹${formatMoney(order.totalAmount)}
            </h2>

            <p>
              Order Status:
              ${labelStatus(order.orderStatus)}
            </p>

            <p>
              Payment Status:
              ${labelStatus(order.paymentStatus)}
            </p>

          </main>
        `,
      );


      invoice.print();
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

                    <div className="table-head">

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
                              className="table-row"
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
                                    order.fullName
                                  }
                                </b>


                                <small>
                                  {
                                    order.email
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


                              <span className="row-actions">

                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      printInvoice(
                                        order,
                                      )
                                  }
                                >
                                  Print
                                </button>

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
