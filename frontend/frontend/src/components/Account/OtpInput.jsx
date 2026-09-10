import { useState, useEffect, useRef } from 'react';

export default function OtpInput({ onComplete, onResend, length = 6 }) {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    // Allow numeric only
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Take last entered character if length > 1
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    const combined = newOtp.join('');
    if (combined.length === length && !newOtp.includes('')) {
      onComplete?.(combined);
    }

    // Auto-focus next field
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle Backspace to move backwards
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    // Filter numeric digits only
    const digits = pastedData.replace(/\D/g, '').slice(0, length);
    if (!digits) return;

    const newOtp = Array(length).fill('');
    for (let i = 0; i < digits.length; i++) {
      newOtp[i] = digits[i];
    }
    setOtp(newOtp);

    // Focus last filled or next index
    const nextIndex = Math.min(digits.length, length - 1);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }

    if (digits.length === length) {
      onComplete?.(digits);
    }
  };

  const handleResendClick = () => {
    if (!canResend) return;
    setOtp(Array(length).fill(''));
    setTimer(30);
    setCanResend(false);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    onResend?.();
  };

  return (
    <div className="otp-container">
      <div className="otp-grid" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`otp-box ${digit ? 'filled' : ''}`}
            aria-label={`Digit ${index + 1} of OTP`}
          />
        ))}
      </div>

      <div className="otp-timer-row">
        <span>Didn't receive the OTP?</span>
        {canResend ? (
          <button type="button" className="resend-link" onClick={handleResendClick}>
            Resend OTP
          </button>
        ) : (
          <span className="resend-countdown">Resend in <strong>{timer}s</strong></span>
        )}
      </div>
    </div>
  );
}
