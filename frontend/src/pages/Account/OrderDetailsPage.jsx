import {
  useEffect,
  useState,
} from 'react';

import {
  getMyOrderByIdApi,
} from '../../components/Account/authService';

import LoadingSpinner
  from '../../components/LoadingSpinner/LoadingSpinner';

import AccountLayout
  from './AccountLayout';


/*
==================================================
HELPERS
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


function formatMoney(
  amount,
) {

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
}


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
ORDER DETAILS PAGE
==================================================
*/

export default function OrderDetailsPage({
  orderId,
}) {

  const [
    order,
    setOrder,
  ] = useState(null);


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
  LOAD ONE ORDER
  ==================================================
  */

  useEffect(() => {

    let active =
      true;


    const loadOrder =
      async () => {

        if (!orderId) {

          setError(
            'Invalid order ID.',
          );

          setLoading(
            false,
          );

          return;
        }


        try {

          setLoading(
            true,
          );


          setError('');


          const result =
            await getMyOrderByIdApi(
              orderId,
            );


          if (
            active
          ) {

            setOrder(
              result,
            );
          }


        } catch (error) {

          if (
            active
          ) {

            setError(
              error.message ||
              'Unable to load this order.',
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


    loadOrder();


    return () => {

      active =
        false;
    };

  }, [
    orderId,
  ]);


  /*
  ==================================================
  LOADING
  ==================================================
  */

  if (
    loading
  ) {

    return (

      <AccountLayout
        active="orders"
      >

        <div className="account-card">

          <LoadingSpinner
            label="Loading order details..."
          />

        </div>

      </AccountLayout>
    );
  }


  /*
  ==================================================
  ERROR
  ==================================================
  */

  if (
    error ||
    !order
  ) {

    return (

      <AccountLayout
        active="orders"
      >

        <div className="account-card">

          <div
            className="account-error"
            role="alert"
          >

            <strong>
              Unable to load order
            </strong>


            <p>
              {
                error ||
                'Order not found.'
              }
            </p>

          </div>


          <a
            href="#orders"
            className="account-submit-btn"
          >
            Back to My Orders
          </a>

        </div>

      </AccountLayout>
    );
  }


  const items =
    Array.isArray(
      order.items,
    )
      ? order.items
      : [];


  return (

    <AccountLayout
      active="orders"
    >

      <div className="account-card">

        <p className="account-kicker">
          ORDER DETAILS
        </p>


        <h1>

          Order #
          {
            order.id
          }

        </h1>


        <p className="account-card-sub">

          Placed on
          {' '}

          {
            formatDate(
              order.createdAt,
            )
          }

        </p>


        {/* STATUS */}

        <div
          style={{
            display:
              'flex',

            flexWrap:
              'wrap',

            gap:
              '12px',

            margin:
              '22px 0',
          }}
        >

          <span>

            Order Status:
            {' '}

            <strong>
              {
                labelStatus(
                  order.orderStatus,
                )
              }
            </strong>

          </span>


          <span>

            Payment Status:
            {' '}

            <strong>
              {
                labelStatus(
                  order.paymentStatus,
                )
              }
            </strong>

          </span>

        </div>


        {/* PRODUCTS */}

        <h2>
          Products
        </h2>


        <div className="orders-list">

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
                    index
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
                          'Product'
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


                    <small>

                      {item.productType === 'PILLOW' ? 'Pack quantity:' : 'Quantity:'}
                      {' '}

                      {
                        item.quantity
                      }

                    </small>


                    {
                      item.productType === 'PILLOW' && (
                        <small>
                          {Number(item.packSize) === 2 ? '2 pillows per pack' : '1 pillow per pack'}
                          {' · '}
                          {Number(item.quantity || 0) * (Number(item.packSize) === 2 ? 2 : 1)} pillows total
                        </small>
                      )
                    }

                  </div>


                  <div>

                    <small>
                      Unit Price
                    </small>


                    <strong>

                      ₹
                      {
                        formatMoney(
                          item.unitPrice,
                        )
                      }

                    </strong>


                    <small>
                      Item Total
                    </small>


                    <strong>

                      ₹
                      {
                        formatMoney(
                          item.itemTotal,
                        )
                      }

                    </strong>

                  </div>

                </div>
              ),
            )
          }

        </div>


        {/* PAYMENT */}

        <div
          style={{
            marginTop:
              '28px',
          }}
        >

          <h2>
            Payment Information
          </h2>


          <p>

            Payment Method:
            {' '}

            <strong>
              {
                labelStatus(
                  order.paymentMethod,
                )
              }
            </strong>

          </p>


          <p>

            Payment Status:
            {' '}

            <strong>
              {
                labelStatus(
                  order.paymentStatus,
                )
              }
            </strong>

          </p>


          {
            order.razorpayPaymentId && (

              <p>

                Razorpay Payment ID:
                {' '}

                <strong>
                  {
                    order.razorpayPaymentId
                  }
                </strong>

              </p>
            )
          }


          {
            order.razorpayOrderId && (

              <p>

                Razorpay Order ID:
                {' '}

                <strong>
                  {
                    order.razorpayOrderId
                  }
                </strong>

              </p>
            )
          }

        </div>


        {/* DELIVERY */}

        <div
          style={{
            marginTop:
              '28px',
          }}
        >

          <h2>
            Delivery Information
          </h2>


          <p>
            <strong>
              {
                order.fullName
              }
            </strong>
          </p>


          <p>
            {
              order.mobile
            }
          </p>


          <p>
            {
              order.email
            }
          </p>


          <p>
            {
              order.fullAddress
            }
          </p>


          <p>

            {
              order.city
            }

            {', '}

            {
              order.state
            }

            {' - '}

            {
              order.pincode
            }

          </p>

        </div>


        {/* TOTAL */}

        <div
          style={{
            marginTop:
              '28px',

            paddingTop:
              '18px',

            borderTop:
              '1px solid #e5e7eb',
          }}
        >

          <h2>

            Total Amount:
            {' '}

            ₹
            {
              formatMoney(
                order.totalAmount,
              )
            }

          </h2>

        </div>


        <a
          href="#orders"
          className="account-submit-btn"
          style={{
            display:
              'inline-block',

            marginTop:
              '20px',
          }}
        >
          ← Back to My Orders
        </a>

      </div>

    </AccountLayout>
  );
}
