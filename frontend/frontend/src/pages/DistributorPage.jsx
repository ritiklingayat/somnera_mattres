import {
  useState,
} from 'react';

import {
  submitDistributorRequest,
} from '../utils/distributorService';

import './DistributorPage.css';


/*
==================================================
INITIAL FORM
==================================================
*/

const INITIAL_FORM = {

  fullName: '',

  phone: '',

  email: '',

  targetCity: '',

  investmentRange:
    '₹5 Lakh – ₹10 Lakh',

  businessExperience: '',
};


/*
==================================================
INVESTMENT OPTIONS
==================================================
*/

const INVESTMENT_OPTIONS = [

  '₹5 Lakh – ₹10 Lakh',

  '₹10 Lakh – ₹20 Lakh',

  '₹20 Lakh – ₹30 Lakh',

  '₹30 Lakh – ₹50 Lakh',

  '₹50 Lakh+',
];


/*
==================================================
DISTRIBUTOR PAGE
==================================================
*/

export function DistributorPage() {

  const [
    formData,
    setFormData,
  ] = useState(
    INITIAL_FORM,
  );


  const [
    errors,
    setErrors,
  ] = useState({});


  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


  const [
    submitStatus,
    setSubmitStatus,
  ] = useState(null);


  /*
  ==================================================
  VALIDATION
  ==================================================

  Mirrors the local repository validation where practical.

  Backend remains authoritative.
  */

  const validate =
    () => {

      const nextErrors = {};


      const fullName =
        formData.fullName
          .trim();


      const phone =
        formData.phone
          .trim();


      const email =
        formData.email
          .trim();


      const targetCity =
        formData.targetCity
          .trim();


      const businessExperience =
        formData.businessExperience
          .trim();


      /*
      ==============================================
      FULL NAME
      ==============================================
      */

      if (!fullName) {

        nextErrors.fullName =
          'Full Name is required';

      } else if (
        fullName.length <
        2
      ) {

        nextErrors.fullName =
          'Full Name must contain at least 2 characters';

      } else if (
        fullName.length >
        150
      ) {

        nextErrors.fullName =
          'Full Name must not exceed 150 characters';
      }


      /*
      ==============================================
      PHONE
      ==============================================
      */

      if (!phone) {

        nextErrors.phone =
          'Phone Number is required';

      } else if (
        !/^[6-9][0-9]{9}$/.test(
          phone,
        )
      ) {

        nextErrors.phone =
          'Please enter a valid 10 digit mobile number';
      }


      /*
      ==============================================
      EMAIL
      ==============================================
      */

      if (!email) {

        nextErrors.email =
          'Email Address is required';

      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email,
        )
      ) {

        nextErrors.email =
          'Please enter a valid email address';

      } else if (
        email.length >
        150
      ) {

        nextErrors.email =
          'Email must not exceed 150 characters';
      }


      /*
      ==============================================
      TARGET LOCATION
      ==============================================
      */

      if (!targetCity) {

        nextErrors.targetCity =
          'Target City / Location is required';

      } else if (
        targetCity.length >
        200
      ) {

        nextErrors.targetCity =
          'Target City / Location must not exceed 200 characters';
      }


      /*
      ==============================================
      INVESTMENT RANGE
      ==============================================
      */

      if (
        !formData
          .investmentRange
          .trim()
      ) {

        nextErrors.investmentRange =
          'Please select an investment range';
      }


      /*
      ==============================================
      BUSINESS EXPERIENCE
      ==============================================
      */

      if (!businessExperience) {

        nextErrors.businessExperience =
          'Business experience description is required';

      } else if (
        businessExperience.length <
        5
      ) {

        nextErrors.businessExperience =
          'Business experience must contain at least 5 characters';

      } else if (
        businessExperience.length >
        1000
      ) {

        nextErrors.businessExperience =
          'Business experience must not exceed 1000 characters';
      }


      setErrors(
        nextErrors,
      );


      return (
        Object.keys(
          nextErrors,
        ).length ===
        0
      );
    };


  /*
  ==================================================
  INPUT CHANGE
  ==================================================
  */

  const handleChange =
    (event) => {

      const {
        name,
        value,
      } =
        event.target;


      setFormData(
        (current) => ({
          ...current,

          [name]:
            value,
        }),
      );


      /*
       * Remove the field error
       * when the customer edits it.
       */

      if (
        errors[name]
      ) {

        setErrors(
          (current) => ({
            ...current,

            [name]:
              undefined,
          }),
        );
      }


      /*
       * Remove previous submission message
       * once user starts editing again.
       */

      if (
        submitStatus
      ) {

        setSubmitStatus(
          null,
        );
      }
    };


  /*
  ==================================================
  PHONE CHANGE
  ==================================================

  Backend accepts Indian 10-digit mobile numbers.
  */

  const handlePhoneChange =
    (event) => {

      const value =
        event.target.value
          .replace(
            /\D/g,
            '',
          )
          .slice(
            0,
            10,
          );


      setFormData(
        (current) => ({
          ...current,

          phone:
            value,
        }),
      );


      if (
        errors.phone
      ) {

        setErrors(
          (current) => ({
            ...current,

            phone:
              undefined,
          }),
        );
      }


      if (
        submitStatus
      ) {

        setSubmitStatus(
          null,
        );
      }
    };


  /*
  ==================================================
  SUBMIT
  ==================================================
  */

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      if (
        isSubmitting
      ) {

        return;
      }


      setSubmitStatus(
        null,
      );


      if (
        !validate()
      ) {

        return;
      }


      try {

        setIsSubmitting(
          true,
        );


        /*
         * Real backend submission.
         *
         * No localStorage fallback.
         */

        const response =
          await submitDistributorRequest(
            formData,
          );


        if (
          !response?.success
        ) {

          throw new Error(
            response?.message ||
            'Failed to submit distributor request.',
          );
        }


        setSubmitStatus({

          type:
            'success',

          message:
            response.message ||
            'Thank you! Your distributor request has been submitted successfully. Our team will contact you soon.',
        });


        /*
         * Clear form only after
         * genuine backend success.
         */

        setFormData(
          INITIAL_FORM,
        );


        setErrors({});


      } catch (error) {

        console.error(
          'Distributor request failed:',
          error,
        );


        setSubmitStatus({

          type:
            'error',

          message:
            error.message ||
            'Unable to submit your distributor request. Please try again.',
        });


      } finally {

        setIsSubmitting(
          false,
        );
      }
    };


  /*
  ==================================================
  UI
  ==================================================
  */

  return (

    <div className="distributor-page">

      {/* HEADER */}

      <div className="distributor-header-banner">

        <div className="container">

          <span className="distributor-kicker">
            SOMNERA PARTNERSHIP NETWORK
          </span>


          <h1 className="distributor-hero-title">
            Become Our Distributor
          </h1>


          <p className="distributor-hero-sub">
            Partner with Somnera and grow with a trusted mattress and sleep solutions brand. Fill out the partnership form below and our expansion team will contact you.
          </p>

        </div>

      </div>


      {/* CONTENT */}

      <div className="container distributor-content-container">

        <div className="distributor-card">

          <div className="distributor-card-header">

            <div className="badge-icon">
              🤝
            </div>


            <h2>
              Distributor Partnership Application
            </h2>


            <p>
              Join our nationwide network of authorized distributors and mattress retail partners.
            </p>

          </div>


          {/* STATUS */}

          {
            submitStatus && (

              <div
                className={
                  `distributor-status-alert ${submitStatus.type}`
                }
                role={
                  submitStatus.type ===
                  'error'
                    ? 'alert'
                    : 'status'
                }
              >

                <span className="alert-icon">

                  {
                    submitStatus.type ===
                      'success'
                      ? '✓'
                      : '⚠️'
                  }

                </span>


                <span>
                  {
                    submitStatus.message
                  }
                </span>

              </div>
            )
          }


          {/* FORM */}

          <form
            className="distributor-form"
            onSubmit={
              handleSubmit
            }
            noValidate
          >

            <div className="form-grid-two">

              {/* FULL NAME */}

              <div className="form-field-wrapper">

                <label htmlFor="dist-fullName">

                  Full Name

                  {' '}

                  <span className="req">
                    *
                  </span>

                </label>


                <input
                  id="dist-fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={
                    formData.fullName
                  }
                  onChange={
                    handleChange
                  }
                  maxLength="150"
                  autoComplete="name"
                  disabled={
                    isSubmitting
                  }
                  className={
                    errors.fullName
                      ? 'has-error'
                      : ''
                  }
                />


                {
                  errors.fullName && (

                    <span className="field-error-msg">
                      {
                        errors.fullName
                      }
                    </span>
                  )
                }

              </div>


              {/* EMAIL */}

              <div className="form-field-wrapper">

                <label htmlFor="dist-email">

                  Email Address

                  {' '}

                  <span className="req">
                    *
                  </span>

                </label>


                <input
                  id="dist-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  maxLength="150"
                  autoComplete="email"
                  disabled={
                    isSubmitting
                  }
                  className={
                    errors.email
                      ? 'has-error'
                      : ''
                  }
                />


                {
                  errors.email && (

                    <span className="field-error-msg">
                      {
                        errors.email
                      }
                    </span>
                  )
                }

              </div>


              {/* PHONE */}

              <div className="form-field-wrapper">

                <label htmlFor="dist-phone">

                  Phone Number

                  {' '}

                  <span className="req">
                    *
                  </span>

                </label>


                <input
                  id="dist-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  value={
                    formData.phone
                  }
                  onChange={
                    handlePhoneChange
                  }
                  maxLength="10"
                  autoComplete="tel"
                  disabled={
                    isSubmitting
                  }
                  className={
                    errors.phone
                      ? 'has-error'
                      : ''
                  }
                />


                {
                  errors.phone && (

                    <span className="field-error-msg">
                      {
                        errors.phone
                      }
                    </span>
                  )
                }

              </div>


              {/* TARGET LOCATION */}

              <div className="form-field-wrapper">

                <label htmlFor="dist-targetCity">

                  Target City / Location

                  {' '}

                  <span className="req">
                    *
                  </span>

                </label>


                <input
                  id="dist-targetCity"
                  name="targetCity"
                  type="text"
                  placeholder="e.g. Mumbai, Pune, Ahmedabad"
                  value={
                    formData.targetCity
                  }
                  onChange={
                    handleChange
                  }
                  maxLength="200"
                  disabled={
                    isSubmitting
                  }
                  className={
                    errors.targetCity
                      ? 'has-error'
                      : ''
                  }
                />


                {
                  errors.targetCity && (

                    <span className="field-error-msg">
                      {
                        errors.targetCity
                      }
                    </span>
                  )
                }

              </div>

            </div>


            {/* INVESTMENT RANGE */}

            <div className="form-field-wrapper full-width">

              <label htmlFor="dist-investmentRange">

                Investment Range

                {' '}

                <span className="req">
                  *
                </span>

              </label>


              <select
                id="dist-investmentRange"
                name="investmentRange"
                value={
                  formData.investmentRange
                }
                onChange={
                  handleChange
                }
                disabled={
                  isSubmitting
                }
                className={
                  errors.investmentRange
                    ? 'has-error'
                    : ''
                }
              >

                {
                  INVESTMENT_OPTIONS.map(
                    (option) => (

                      <option
                        key={
                          option
                        }
                        value={
                          option
                        }
                      >
                        {
                          option
                        }
                      </option>
                    ),
                  )
                }

              </select>


              {
                errors.investmentRange && (

                  <span className="field-error-msg">
                    {
                      errors.investmentRange
                    }
                  </span>
                )
              }

            </div>


            {/* BUSINESS EXPERIENCE */}

            <div className="form-field-wrapper full-width">

              <label htmlFor="dist-businessExperience">

                Business Experience

                {' '}

                <span className="req">
                  *
                </span>

              </label>


              <textarea
                id="dist-businessExperience"
                name="businessExperience"
                rows="4"
                placeholder="Tell us about your business experience or current business."
                value={
                  formData.businessExperience
                }
                onChange={
                  handleChange
                }
                minLength="5"
                maxLength="1000"
                disabled={
                  isSubmitting
                }
                className={
                  errors.businessExperience
                    ? 'has-error'
                    : ''
                }
              />


              {
                errors.businessExperience && (

                  <span className="field-error-msg">
                    {
                      errors.businessExperience
                    }
                  </span>
                )
              }

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="distributor-submit-btn"
              disabled={
                isSubmitting
              }
            >

              {
                isSubmitting
                  ? (

                    <>
                      <span className="spinner-dot" />

                      {' '}

                      Submitting...
                    </>
                  )

                  : (

                    <>
                      SUBMIT DISTRIBUTOR REQUEST

                      {' '}

                      <span className="arrow-icon">
                        ↗
                      </span>
                    </>
                  )
              }

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
