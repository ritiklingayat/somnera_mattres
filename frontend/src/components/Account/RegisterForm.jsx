import { useState } from 'react';
import { useAuth } from './AuthContext';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

// Eye-open SVG icon
const EyeOpenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Eye-off SVG icon
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// Email SVG icon
const EmailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

// Lock SVG icon
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// Check SVG icon
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Password strength calculator
const calculatePasswordStrength = (pass) => {
  if (!pass) return { score: 0, label: '', color: '' };
  if (pass.length < 8) return { score: 1, label: 'Weak (min 8 chars)', color: '#e74c3c' };
  let score = 1;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (score <= 2) return { score: 2, label: 'Medium', color: '#f39c12' };
  return { score: 3, label: 'Strong', color: '#2ecc71' };
};

// Indian mobile validation: exactly 10 digits starting with 6, 7, 8, or 9
const validateMobile = (mob) => /^[6-9]\d{9}$/.test(mob.trim());

export default function RegisterForm() {
  const { register, generateRegistrationOtp, setModalView } = useAuth();

  // step: 1 = Email + Generate OTP, 2 = Full registration form
  const [step, setStep] = useState(1);

  // Step 1 state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // Step 2 state — never store password/confirmPassword/otp in localStorage/sessionStorage
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setError('');
  };

  const strength = calculatePasswordStrength(formData.password);

  // ─────────────────────────────────────────
  // STEP 1: Generate OTP
  // ─────────────────────────────────────────
  const handleGenerateOtp = async (e) => {
    e.preventDefault();
    setError('');
    setOtpSuccess('');

    const em = otpEmail.trim();
    if (!em) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setOtpLoading(true);
      await generateRegistrationOtp(em);
      // Preserve email and advance to step 2
      setOtpSuccess('OTP sent successfully to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Unable to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // STEP 2: Resend OTP
  // ─────────────────────────────────────────
  const handleResendOtp = async () => {
    setError('');
    setOtpSuccess('');
    try {
      setResendLoading(true);
      await generateRegistrationOtp(otpEmail.trim());
      setOtpSuccess('OTP resent successfully.');
      // Clear OTP field so user types the fresh one
      setFormData((prev) => ({ ...prev, otp: '' }));
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // STEP 2: Back to Step 1
  // ─────────────────────────────────────────
  const handleBack = () => {
    setError('');
    setOtpSuccess('');
    // Keep otpEmail so user can see what they entered
    // Clear OTP from form to prevent stale value on re-entry
    setFormData((prev) => ({ ...prev, otp: '' }));
    setStep(1);
  };

  // ─────────────────────────────────────────
  // STEP 2: Create Account
  // ─────────────────────────────────────────
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    setOtpSuccess('');

    const fn = formData.firstName.trim();
    const ln = formData.lastName.trim();
    const mob = formData.mobile.trim();
    const pass = formData.password;
    const confirm = formData.confirmPassword;
    const otp = formData.otp.trim();

    // Validate all fields
    if (!fn) {
      setError('First Name is required.');
      return;
    }
    if (!ln) {
      setError('Last Name is required.');
      return;
    }
    if (!validateMobile(mob)) {
      setError('Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.');
      return;
    }
    if (!pass || pass.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (pass !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!otp) {
      setError('Please enter the OTP sent to your email.');
      return;
    }

    // Build exact backend payload
    const payload = {
      firstName: fn,
      lastName: ln,
      email: otpEmail.trim(),
      mobile: mob,
      password: pass,
      confirmPassword: confirm,
      otp,
    };

    try {
      setSubmitLoading(true);
      await register(payload);
      // AuthContext.register() closes modal and shows toast on success
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="auth-form-view">
      <div className="auth-header">
        <h2>Create Your Account</h2>
        <p>
          {step === 1
            ? 'Join Somnera for personalized comfort & exclusive sleep benefits.'
            : 'Complete your details to finish creating your account.'}
        </p>
      </div>

      {/* STEP INDICATOR — 2 steps only */}
      <div className="step-indicator">
        <div className={`step-pill ${step >= 1 ? 'active' : ''}`}>
          <span>1</span> Email
        </div>
        <div className="step-line" />
        <div className={`step-pill ${step >= 2 ? 'active' : ''}`}>
          <span>2</span> Details
        </div>
      </div>

      {/* Step label */}
      <p style={{ fontSize: '0.78rem', color: 'var(--muted, #756f73)', margin: '-8px 0 0', textAlign: 'center' }}>
        Step {step} of 2
      </p>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {otpSuccess && !error && (
        <div
          className="auth-alert"
          role="status"
          style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{otpSuccess}</span>
        </div>
      )}

      {/* ─────────────── STEP 1: EMAIL + GENERATE OTP ─────────────── */}
      {step === 1 && (
        <form onSubmit={handleGenerateOtp} noValidate className="step-form">
          <div className="form-group">
            <label htmlFor="reg-email-step1">Email Address *</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <EmailIcon />
              </span>
              <input
                id="reg-email-step1"
                type="email"
                placeholder="you@example.com"
                value={otpEmail}
                onChange={(e) => {
                  setOtpEmail(e.target.value);
                  setError('');
                }}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={otpLoading}>
            {otpLoading ? (
              <LoadingSpinner label="Sending OTP..." inline />
            ) : (
              'Generate OTP'
            )}
          </button>
        </form>
      )}

      {/* ─────────────── STEP 2: FULL DETAILS + OTP ─────────────── */}
      {step === 2 && (
        <form onSubmit={handleCreateAccount} noValidate className="step-form">
          {/* First Name */}
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="reg-firstname">First Name *</label>
              <input
                id="reg-firstname"
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Last Name */}
            <div className="form-group">
              <label htmlFor="reg-lastname">Last Name *</label>
              <input
                id="reg-lastname"
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email — read-only, auto-populated from Step 1 */}
          <div className="form-group">
            <label htmlFor="reg-email-step2">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <EmailIcon />
              </span>
              <input
                id="reg-email-step2"
                type="email"
                value={otpEmail}
                readOnly
                tabIndex={-1}
                style={{ background: '#f5f3f0', color: 'var(--muted, #756f73)', cursor: 'default' }}
              />
            </div>
            <small className="field-hint">OTP was sent to this email. Use ← Back to change it.</small>
          </div>

          {/* Mobile Number */}
          <div className="form-group">
            <label htmlFor="reg-mobile">Mobile Number (India 10-digit) *</label>
            <div className="input-wrapper">
              <span className="input-icon country-code-flag">+91</span>
              <input
                id="reg-mobile"
                type="text"
                inputMode="numeric"
                placeholder="9876543210"
                maxLength={10}
                value={formData.mobile}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  updateField('mobile', cleaned);
                }}
                required
              />
            </div>
            <small className="field-hint">Must start with 6, 7, 8, or 9.</small>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password">Password *</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <LockIcon />
              </span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {formData.password && (
              <div className="strength-meter">
                <div className="strength-bar-bg">
                  <div
                    className="strength-bar-fill"
                    style={{
                      width: `${(strength.score / 3) * 100}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
                <span className="strength-text" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="reg-confirmpassword">Confirm Password *</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <CheckIcon />
              </span>
              <input
                id="reg-confirmpassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
              </button>
            </div>
            {/* Inline mismatch warning */}
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <small style={{ color: '#9b1c1c', fontSize: '0.78rem' }}>Passwords do not match.</small>
            )}
          </div>

          {/* OTP */}
          <div className="form-group">
            <label htmlFor="reg-otp">OTP (from your email) *</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </span>
              <input
                id="reg-otp"
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP received on email"
                maxLength={6}
                value={formData.otp}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  updateField('otp', cleaned);
                }}
                required
                autoComplete="one-time-code"
              />
            </div>

            {/* Resend OTP link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <small className="field-hint">Didn't receive it?</small>
              <button
                type="button"
                className="resend-link"
                onClick={handleResendOtp}
                disabled={resendLoading}
                style={{ fontSize: '0.8rem' }}
              >
                {resendLoading ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          </div>

          {/* CREATE ACCOUNT button */}
          <button type="submit" className="auth-submit-btn" disabled={submitLoading}>
            {submitLoading ? (
              <LoadingSpinner label="Creating Account..." inline />
            ) : (
              'CREATE ACCOUNT'
            )}
          </button>

          {/* Back button */}
          <button
            type="button"
            className="auth-back-btn"
            onClick={handleBack}
            style={{ width: '100%' }}
          >
            ← Back
          </button>
        </form>
      )}

      <div className="auth-footer-prompt">
        <span>Already have an account?</span>
        <button type="button" className="link-btn-accent" onClick={() => setModalView('login')}>
          Login Now
        </button>
      </div>
    </div>
  );
}
