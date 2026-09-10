import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAdminOrdersApi,
} from '../services/adminService';

import OrderTable
  from '../components/OrderTable';


const formatMoney =
  (amount) =>
    Number(
      amount || 0,
    ).toLocaleString(
      'en-IN',
      {
        maximumFractionDigits: 2,
      },
    );


export default function OverviewPage({
  onNavigate,
}) {

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
  ================================================
  LOAD REAL ADMIN ORDERS
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
              Array.isArray(
                result,
              )
                ? result
                : [],
            );
          }


        } catch (error) {

          if (
            active
          ) {

            setError(
              error.message ||
              'Unable to load dashboard data.',
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
  DASHBOARD CALCULATIONS
  ================================================
  */

  const {
    totalSales,
    pendingOrders,
    averageOrderValue,
  } =
    useMemo(() => {

      /*
       * Count successful/confirmed revenue.
       *
       * Exclude cancelled orders.
       */

      const validOrders =
        orders.filter(
          (order) =>
            String(
              order.orderStatus ||
              '',
            ).toUpperCase() !==
            'CANCELLED',
        );


      const sales =
        validOrders.reduce(
          (
            sum,
            order,
          ) =>
            sum +
            Number(
              order.totalAmount ||
              0,
            ),
          0,
        );


      const pending =
        orders.filter(
          (order) =>
            [
              'PENDING_PAYMENT',
              'CONFIRMED',
              'PROCESSING',
            ].includes(
              String(
                order.orderStatus ||
                '',
              ).toUpperCase(),
            ),
        ).length;


      const average =
        validOrders.length >
          0
          ? sales /
            validOrders.length
          : 0;


      return {

        totalSales:
          sales,

        pendingOrders:
          pending,

        averageOrderValue:
          average,
      };

    }, [
      orders,
    ]);


  /*
  ================================================
  STATS
  ================================================
  */

  const stats = [

    [
      `₹${formatMoney(
        totalSales,
      )}`,
      'Total sales',
      'Local browser data',
    ],

    [
      orders.length,
      'Total orders',
      'All customer orders',
    ],

    [
      pendingOrders,
      'Pending orders',
      pendingOrders >
        0
        ? 'Needs attention'
        : 'All caught up',
    ],

    [
      `₹${formatMoney(
        averageOrderValue,
      )}`,
      'Average order value',
      'Calculated from orders',
    ],
  ];


  /*
  ================================================
  LOADING
  ================================================
  */

  if (
    loading
  ) {

    return (

      <div
        style={{
          padding:
            '40px',
        }}
      >

        Loading dashboard...

      </div>
    );
  }


  /*
  ================================================
  ERROR
  ================================================
  */

  if (
    error
  ) {

    return (

      <div
        style={{
          padding:
            '40px',
        }}
      >

        <h2>
          Unable to load dashboard
        </h2>


        <p>
          {
            error
          }
        </p>

      </div>
    );
  }


  /*
  ================================================
  UI
  ================================================
  */

  return (

    <>

      <div className="admin-title">

        <div>

          <p>
            Store performance
          </p>


          <h1>
            Good morning, Admin.
          </h1>

        </div>


        <button
          className="admin-action"
          onClick={
            () =>
              onNavigate(
                'orders',
              )
          }
        >
          View orders
        </button>

      </div>


      {/* STATS */}

      <div className="stat-grid">

        {
          stats.map(
            ([
              value,
              label,
              note,
            ]) => (

              <article
                key={
                  label
                }
              >

                <span>
                  {
                    label
                  }
                </span>


                <strong>
                  {
                    value
                  }
                </strong>


                <small>
                  {
                    note
                  }
                </small>

              </article>
            ),
          )
        }

      </div>


      {/* SALES PERFORMANCE */}

      <section className="admin-card performance">

        <div className="card-title">

          <div>

            <h2>
              Sales performance
            </h2>


            <p>
              Current order revenue
            </p>

          </div>


          <b>

            ₹
            {
              formatMoney(
                totalSales,
              )
            }

          </b>

        </div>


        {/*
         * Existing visual bar chart preserved.
         *
         * We are not claiming these bars are
         * real daily analytics yet.
         */}

        <div className="bar-chart">

          {
            [
              42,
              66,
              48,
              78,
              58,
              90,
              74,
            ].map(
              (
                value,
                index,
              ) => (

                <div
                  key={
                    index
                  }
                >

                  <i
                    style={{
                      height:
                        `${value}%`,
                    }}
                  />


                  <span>

                    {
                      [
                        'M',
                        'T',
                        'W',
                        'T',
                        'F',
                        'S',
                        'S',
                      ][
                        index
                      ]
                    }

                  </span>

                </div>
              ),
            )
          }

        </div>

      </section>


      {/* RECENT ORDERS */}

      <section className="admin-card">

        <div className="card-title">

          <div>

            <h2>
              Recent orders
            </h2>


            <p>
              Latest customer purchases
            </p>

          </div>


          <button
            onClick={
              () =>
                onNavigate(
                  'orders',
                )
            }
          >
            View all
          </button>

        </div>


        {
          orders.length ===
            0
            ? (

              <div
                style={{
                  padding:
                    '30px',

                  textAlign:
                    'center',
                }}
              >
                No orders yet.
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
                    Payment
                  </span>

                </div>


                {
                  orders
                    .slice(
                      0,
                      4,
                    )
                    .map(
                      (order) => (

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

                            {
                              String(
                                order.orderStatus ||
                                '',
                              )
                                .replaceAll(
                                  '_',
                                  ' ',
                                )
                            }

                          </span>


                          <span>

                            {
                              String(
                                order.paymentStatus ||
                                '',
                              )
                            }

                          </span>

                        </div>
                      ),
                    )
                }

              </div>
            )
        }

      </section>

    </>
  );
}
