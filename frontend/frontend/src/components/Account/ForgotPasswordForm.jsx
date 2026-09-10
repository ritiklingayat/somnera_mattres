import {
  useState,
} from 'react';

import {
  useAuth,
} from './AuthContext';

import OtpInput
  from './OtpInput';

import LoadingSpinner
  from '../LoadingSpinner/LoadingSpinner';


export default function ForgotPasswordForm() {

  const {
    forgotPassword,
    resetPassword,
    setModalView,
  } = useAuth();


  /*
  ==================================================
  FLOW
  ==================================================

  Step 1:
  Email

  Step 2:
  OTP
  New Password
  Confirm Password

  Step 3:
  Success
  */

  const [
    step,
    setStep,
  ] = useState(1);


  const [
    email,
    setEmail,
  ] = useState('');


  const [
    otp,
    setOtp,
  ] = useState('');


  const [
    newPassword,
    setNewPassword,
  ] = useState('');


  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');


  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);


  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    resendLoading,
    setResendLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState('');


  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');


  /*
  ==================================================
  STEP 1 - SEND RESET OTP
  ==================================================
  */

  const handleEmailSubmit =
    async (event) => {

      event.preventDefault();

      setError('');
      setSuccessMessage('');


      const normalizedEmail =
        email.trim();


      if (
        !normalizedEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          normalizedEmail,
        )
      ) {
        setError(
          'Please enter a valid email address.',
        );

        return;
      }


      try {

        setLoading(true);


        await forgotPassword(
          normalizedEmail,
        );


        setSuccessMessage(
          'If an account exists with this email, a password reset OTP has been sent.',
        );


        setStep(2);

      } catch (err) {

        setError(
          err.message ||
          'Unable to send password reset OTP. Please try again.',
        );

      } finally {

        setLoading(false);
      }
    };


  /*
  ==================================================
  OTP INPUT
  ==================================================
  */

  const handleOtpComplete =
    (otpCode) => {

      setOtp(otpCode);
      setError('');
    };


  /*
  ==================================================
  RESEND OTP
  ==================================================

  Backend forgot-password endpoint automatically
  invalidates the previous OTP and sends a new one.
  */

  const handleResendOtp =
    async () => {

      setError('');
      setSuccessMessage('');


      try {

        setResendLoading(true);


        await forgotPassword(
          email.trim(),
        );


        setOtp('');


        setSuccessMessage(
          'A new password reset OTP has been sent.',
        );

      } catch (err) {

        setError(
          err.message ||
          'Unable to resend OTP.',
        );

      } finally {

        setResendLoading(false);
      }
    };


  /*
  ==================================================
  STEP 2 - RESET PASSWORD
  ==================================================
  */

  const handleResetSubmit =
    async (event) => {

      event.preventDefault();

      setError('');
      setSuccessMessage('');


      const normalizedOtp =
        otp.trim();


      if (
        !/^\d{6}$/.test(
          normalizedOtp,
        )
      ) {
        setError(
          'Please enter the complete 6-digit OTP.',
        );

        return;
      }


      if (
        !newPassword ||
        newPassword.length < 8 ||
        newPassword.length > 100
      ) {
        setError(
          'Password must be between 8 and 100 characters.',
        );

        return;
      }


      if (
        newPassword !==
        confirmPassword
      ) {
        setError(
          'Confirm password does not match.',
        );

        return;
      }


      try {

        setLoading(true);


        await resetPassword({
          email:
            email.trim(),

          otp:
            normalizedOtp,

          newPassword,

          confirmPassword,
        });


        setStep(3);

      } catch (err) {

        setError(
          err.message ||
          'Password reset failed. Please check your OTP and try again.',
        );

      } finally {

        setLoading(false);
      }
    };


  /*
  ==================================================
  UI
  ==================================================
  */

  return (

    <div className="auth-form-view">

      <div className="auth-header">

        <h2>
          {
            step === 3
              ? 'Password Updated!'
              : 'Reset Password'
          }
        </h2>


        <p>

          {
            step === 1 &&
            'Enter your registered email address to receive a 6-digit OTP.'
          }


          {
            step === 2 &&
            `Enter the OTP sent to ${email} and create your new password.`
          }


          {
            step === 3 &&
            'Your password has been changed successfully. You can now login using your new password.'
          }

        </p>

      </div>


      {
        error && (

          <div
            className="auth-alert auth-alert-error"
            role="alert"
          >

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >

              <circle
                cx="12"
                cy="12"
                r="10"
              />

              <line
                x1="12"
                y1="8"
                x2="12"
                y2="12"
              />

              <line
                x1="12"
                y1="16"
                x2="12.01"
                y2="16"
              />

            </svg>

            <span>
              {error}
            </span>

          </div>
        )
      }


      {
        successMessage &&
        step !== 3 && (

          <div
            className="auth-alert auth-alert-success"
          >

            <span>
              {successMessage}
            </span>

          </div>
        )
      }


      {/* ========================================
          STEP 1 - EMAIL
      ======================================== */}

      {
        step === 1 && (

          <form
            onSubmit={
              handleEmailSubmit
            }
            noValidate
          >

            <div className="form-group">

              <label
                htmlFor="forgot-email"
              >
                Email Address
              </label>


              <div className="input-wrapper">

                <span className="input-icon">

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >

                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />

                    <polyline points="22,6 12,13 2,6" />

                  </svg>

                </span>


                <input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={
                    (event) =>
                      setEmail(
                        event.target.value,
                      )
                  }
                  required
                  autoComplete="email"
                />

              </div>

            </div>


            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >

              {
                loading
                  ? (
                    <LoadingSpinner
                      label="Sending OTP..."
                      inline
                    />
                  )
                  : 'Send OTP'
              }

            </button>

          </form>
        )
      }


      {/* ========================================
          STEP 2 - OTP + PASSWORD
      ======================================== */}

      {
        step === 2 && (

          <form
            onSubmit={
              handleResetSubmit
            }
            noValidate
            className="step-form"
          >

            <div className="form-group">

              <label>
                Enter 6-Digit OTP
              </label>


              <OtpInput
                onComplete={
                  handleOtpComplete
                }
                onResend={
                  handleResendOtp
                }
                length={6}
              />


              {
                resendLoading && (

                  <div className="loading-status">
                    Sending new OTP...
                  </div>
                )
              }

            </div>


            <div className="form-group">

              <label
                htmlFor="new-password"
              >
                New Password
              </label>


              <div className="input-wrapper">

                <span className="input-icon">

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >

                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    />

                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />

                  </svg>

                </span>


                <input
                  id="new-password"
                  type={
                    showNewPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={
                    (event) =>
                      setNewPassword(
                        event.target.value,
                      )
                  }
                  required
                  autoComplete="new-password"
                />


                <button
                  type="button"
                  className="password-toggle"
                  onClick={
                    () =>
                      setShowNewPassword(
                        !showNewPassword,
                      )
                  }
                  aria-label={
                    showNewPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {
                    showNewPassword
                      ? '🙈'
                      : '👁'
                  }

                </button>

              </div>

            </div>


            <div className="form-group">

              <label
                htmlFor="confirm-new-password"
              >
                Confirm Password
              </label>


              <div className="input-wrapper">

                <span className="input-icon">

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >

                    <polyline points="20 6 9 17 4 12" />

                  </svg>

                </span>


                <input
                  id="confirm-new-password"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Re-enter new password"
                  value={
                    confirmPassword
                  }
                  onChange={
                    (event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                  }
                  required
                  autoComplete="new-password"
                />


                <button
                  type="button"
                  className="password-toggle"
                  onClick={
                    () =>
                      setShowConfirmPassword(
                        !showConfirmPassword,
                      )
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {
                    showConfirmPassword
                      ? '🙈'
                      : '👁'
                  }

                </button>

              </div>

            </div>


            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >

              {
                loading
                  ? (
                    <LoadingSpinner
                      label="Updating Password..."
                      inline
                    />
                  )
                  : 'Update Password'
              }

            </button>


            <button
              type="button"
              className="auth-back-btn mt-4"
              onClick={
                () => {

                  setError('');
                  setOtp('');
                  setStep(1);
                }
              }
            >
              ← Change Email
            </button>

          </form>
        )
      }


      {/* ========================================
          STEP 3 - SUCCESS
      ======================================== */}

      {
        step === 3 && (

          <div className="auth-success-box">

            <div className="success-icon">

              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#241132"
                strokeWidth="2.5"
              >

                <polyline points="20 6 9 17 4 12" />

              </svg>

            </div>


            <h3>
              Password Updated Successfully
            </h3>


            <p>
              You can now login using your new password.
            </p>


            <button
              type="button"
              className="auth-submit-btn"
              onClick={
                () =>
                  setModalView(
                    'login',
                  )
              }
            >
              Login Now
            </button>

          </div>
        )
      }


      {
        step !== 3 && (

          <div className="auth-footer-prompt">

            <span>
              Remember your password?
            </span>


            <button
              type="button"
              className="link-btn-accent"
              onClick={
                () =>
                  setModalView(
                    'login',
                  )
              }
            >
              Back to Login
            </button>

          </div>
        )
      }

    </div>
  );
}