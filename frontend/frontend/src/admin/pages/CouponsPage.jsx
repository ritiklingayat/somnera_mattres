import {
  useEffect,
  useState,
} from 'react';

import AdminModal
  from '../components/AdminModal';

import {
  createAdminCouponApi,
  deleteAdminCouponApi,
  getAdminCouponsApi,
  updateAdminCouponApi,
} from '../services/adminService';


const emptyForm = {

  code: '',

  discountType:
    'PERCENTAGE',

  discountValue:
    '',

  expiryDate:
    '',

  active:
    true,

  publicVisible:
    true,
};


function formatDiscount(
  coupon,
) {

  if (
    coupon.discountType ===
    'PERCENTAGE'
  ) {

    return `${Number(
      coupon.discountValue ||
      0,
    )}%`;
  }


  return `₹${Number(
    coupon.discountValue ||
    0,
  ).toLocaleString(
    'en-IN',
  )}`;
}


export default function CouponsPage() {

  const [
    coupons,
    setCoupons,
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
    isOpen,
    setIsOpen,
  ] = useState(false);


  const [
    editingCoupon,
    setEditingCoupon,
  ] = useState(null);


  const [
    form,
    setForm,
  ] = useState(
    emptyForm,
  );


  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    deletingId,
    setDeletingId,
  ] = useState(null);


  /*
  ================================================
  LOAD COUPONS
  ================================================
  */

  const loadCoupons =
    async () => {

      try {

        setLoading(
          true,
        );


        setError('');


        const result =
          await getAdminCouponsApi();


        setCoupons(
          result,
        );


      } catch (error) {

        console.error(
          'Unable to load coupons:',
          error,
        );


        setError(
          error.message ||
          'Unable to load coupons.',
        );


      } finally {

        setLoading(
          false,
        );
      }
    };


  useEffect(
    () => {

      loadCoupons();

    },
    [],
  );


  /*
  ================================================
  OPEN ADD
  ================================================
  */

  const openAdd =
    () => {

      setEditingCoupon(
        null,
      );


      setForm({
        ...emptyForm,
      });


      setError('');


      setIsOpen(
        true,
      );
    };


  /*
  ================================================
  OPEN EDIT
  ================================================
  */

  const openEdit =
    (coupon) => {

      setEditingCoupon(
        coupon,
      );


      setForm({

        code:
          coupon.code ||
          '',

        discountType:
          coupon.discountType ||
          'PERCENTAGE',

        discountValue:
          coupon.discountValue ??
          '',

        expiryDate:
          coupon.expiryDate ||
          '',

        active:
          Boolean(
            coupon.active,
          ),

        publicVisible:
          coupon.publicVisible !==
            false,
      });


      setError('');


      setIsOpen(
        true,
      );
    };


  /*
  ================================================
  CLOSE MODAL
  ================================================
  */

  const close =
    () => {

      if (
        saving
      ) {

        return;
      }


      setIsOpen(
        false,
      );


      setEditingCoupon(
        null,
      );


      setForm({
        ...emptyForm,
      });
    };


  /*
  ================================================
  INPUT CHANGE
  ================================================
  */

  const handleChange =
    (event) => {

      const {
        name,
        value,
        type,
        checked,
      } =
        event.target;


      setForm(
        (current) => ({

          ...current,

          [name]:
            type ===
              'checkbox'
              ? checked
              : value,
        }),
      );
    };


  /*
  ================================================
  SAVE COUPON
  ================================================
  */

  const save =
    async (event) => {

      event.preventDefault();


      const payload = {

        code:
          form.code
            .trim()
            .toUpperCase(),

        discountType:
          form.discountType,

        discountValue:
          Number(
            form.discountValue,
          ),

        expiryDate:
          form.expiryDate,

        active:
          form.active,

        publicVisible:
          form.publicVisible,
      };


      try {

        setSaving(
          true,
        );


        setError('');


        /*
        --------------------------------
        UPDATE
        --------------------------------
        */

        if (
          editingCoupon
        ) {

          const updated =
            await updateAdminCouponApi(
              editingCoupon.id,
              payload,
            );


          setCoupons(
            (current) =>
              current.map(
                (coupon) =>
                  coupon.id ===
                    updated.id
                    ? updated
                    : coupon,
              ),
          );


        } else {

          /*
          --------------------------------
          CREATE
          --------------------------------
          */

          const created =
            await createAdminCouponApi(
              payload,
            );


          setCoupons(
            (current) => [
              created,
              ...current,
            ],
          );
        }


        setIsOpen(
          false,
        );


        setEditingCoupon(
          null,
        );


        setForm({
          ...emptyForm,
        });


      } catch (error) {

        console.error(
          'Unable to save coupon:',
          error,
        );


        setError(
          error.message ||
          'Unable to save coupon.',
        );


      } finally {

        setSaving(
          false,
        );
      }
    };


  /*
  ================================================
  DELETE COUPON
  ================================================
  */

  const remove =
    async (coupon) => {

      const confirmed =
        window.confirm(
          `Delete coupon ${coupon.code}?`,
        );


      if (
        !confirmed
      ) {

        return;
      }


      try {

        setDeletingId(
          coupon.id,
        );


        setError('');


        await deleteAdminCouponApi(
          coupon.id,
        );


        setCoupons(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                coupon.id,
            ),
        );


      } catch (error) {

        console.error(
          'Unable to delete coupon:',
          error,
        );


        setError(
          error.message ||
          'Unable to delete coupon.',
        );


      } finally {

        setDeletingId(
          null,
        );
      }
    };


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
            Promotions
          </p>


          <h1>
            Coupons
          </h1>

        </div>


        <button
          type="button"
          className="admin-action"
          onClick={
            openAdd
          }
        >
          + Create coupon
        </button>

      </div>


      {
        error && (

          <div
            className="admin-card"
            style={{
              marginBottom:
                '18px',

              color:
                '#b42318',
            }}
          >

            {
              error
            }

          </div>
        )
      }


      <section className="admin-card">

        {
          loading
            ? (

              <div
                style={{
                  padding:
                    '50px',

                  textAlign:
                    'center',
                }}
              >

                Loading coupons...

              </div>
            )

            : coupons.length ===
              0
              ? (

                <div className="module-empty">

                  <span>
                    ✦
                  </span>


                  <h2>
                    No active offers yet.
                  </h2>


                  <p>
                    Create a coupon to increase conversions.
                    Coupons created here are stored in the backend
                    and can be applied by customers during checkout.
                  </p>


                  <button
                    type="button"
                    onClick={
                      openAdd
                    }
                  >
                    Create coupon
                  </button>

                </div>
              )

              : (

                <div className="order-table">

                  <div
                    className="table-head"
                    style={{
                      gridTemplateColumns:
                        '1.3fr 1fr 1fr 1fr 1fr 1.2fr',
                    }}
                  >

                    <span>
                      Coupon
                    </span>


                    <span>
                      Discount
                    </span>


                    <span>
                      Expiry
                    </span>


                    <span>
                      Status
                    </span>


                    <span>
                      Visibility
                    </span>


                    <span>
                      Actions
                    </span>

                  </div>


                  {
                    coupons.map(
                      (coupon) => (

                        <div
                          className="table-row"
                          key={
                            coupon.id
                          }
                          style={{
                            gridTemplateColumns:
                              '1.3fr 1fr 1fr 1fr 1fr 1.2fr',
                          }}
                        >

                          <span>

                            <b>
                              {
                                coupon.code
                              }
                            </b>


                            <small>
                              ID #
                              {
                                coupon.id
                              }
                            </small>

                          </span>


                          <span>

                            <b>

                              {
                                formatDiscount(
                                  coupon,
                                )
                              }

                            </b>


                            <small>

                              {
                                coupon.discountType ===
                                  'PERCENTAGE'
                                  ? 'Percentage'
                                  : 'Fixed amount'
                              }

                            </small>

                          </span>


                          <span>

                            {
                              coupon.expiryDate
                            }

                          </span>


                          <span>

                            <b>

                              {
                                coupon.active
                                  ? 'Active'
                                  : 'Inactive'
                              }

                            </b>

                          </span>


                          <span>

                            <b>

                              {
                                coupon.publicVisible
                                  ? 'Public'
                                  : 'Private'
                              }

                            </b>


                            <small>

                              {
                                coupon.publicVisible
                                  ? 'Shown to customers'
                                  : 'Manual code only'
                              }

                            </small>

                          </span>


                          <span
                            style={{
                              display:
                                'flex',

                              gap:
                                '8px',

                              flexWrap:
                                'wrap',
                            }}
                          >

                            <button
                              type="button"
                              onClick={
                                () =>
                                  openEdit(
                                    coupon,
                                  )
                              }
                            >
                              Edit
                            </button>


                            <button
                              type="button"
                              className="danger"
                              disabled={
                                deletingId ===
                                coupon.id
                              }
                              onClick={
                                () =>
                                  remove(
                                    coupon,
                                  )
                              }
                            >

                              {
                                deletingId ===
                                  coupon.id
                                  ? 'Removing...'
                                  : 'Remove'
                              }

                            </button>

                          </span>

                        </div>
                      ),
                    )
                  }

                </div>
              )
        }

      </section>


      {
        isOpen && (

          <AdminModal
            title={
              editingCoupon
                ? 'Edit coupon'
                : 'Create coupon'
            }
            onClose={
              close
            }
          >

            <form
              className="admin-form-stack"
              onSubmit={
                save
              }
            >

              <label>

                Coupon code

                <input
                  required
                  name="code"
                  value={
                    form.code
                  }
                  onChange={
                    (event) =>
                      setForm(
                        (current) => ({

                          ...current,

                          code:
                            event.target.value
                              .toUpperCase(),
                        }),
                      )
                  }
                  minLength="2"
                  maxLength="50"
                  placeholder="SOMNERA10"
                  disabled={
                    saving
                  }
                />

              </label>


              <label>

                Discount type

                <select
                  required
                  name="discountType"
                  value={
                    form.discountType
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                >

                  <option value="PERCENTAGE">
                    Percentage (%)
                  </option>


                  <option value="FIXED">
                    Fixed amount (₹)
                  </option>

                </select>

              </label>


              <label>

                Discount value

                <input
                  required
                  name="discountValue"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={
                    form.discountType ===
                      'PERCENTAGE'
                      ? '99.99'
                      : undefined
                  }
                  value={
                    form.discountValue
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={
                    form.discountType ===
                      'PERCENTAGE'
                      ? '10'
                      : '500'
                  }
                  disabled={
                    saving
                  }
                />

              </label>


              <label>

                Expiry date

                <input
                  required
                  name="expiryDate"
                  type="date"
                  value={
                    form.expiryDate
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                />

              </label>


              <label
                style={{
                  display:
                    'flex',

                  gap:
                    '10px',

                  alignItems:
                    'center',
                }}
              >

                <input
                  name="active"
                  type="checkbox"
                  checked={
                    form.active
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                />


                Active coupon

              </label>


              <label
                style={{
                  display:
                    'flex',

                  gap:
                    '10px',

                  alignItems:
                    'center',
                }}
              >

                <input
                  name="publicVisible"
                  type="checkbox"
                  checked={
                    form.publicVisible
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    saving
                  }
                />


                Show this coupon to customers

              </label>


              <small
                style={{
                  marginTop:
                    '-6px',

                  color:
                    '#64748b',

                  lineHeight:
                    1.5,
                }}
              >

                If enabled, customers can see this coupon under
                "View available coupons" during checkout.
                If disabled, the coupon can still be entered manually.

              </small>


              <button
                type="submit"
                className="admin-action"
                disabled={
                  saving
                }
              >

                {
                  saving
                    ? 'Saving...'
                    : 'Save'
                }

              </button>

            </form>

          </AdminModal>
        )
      }

    </>
  );
}