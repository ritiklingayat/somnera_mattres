import { useEffect } from 'react';
import { useAuth } from './AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import logo from '../../assets/images/somnera-logo.jpeg';
import mattressImg from '../../assets/images/og-ortho.jpeg';
import './AuthModal.css';

export default function AuthModal() {
  const { modalOpen, modalView, closeAuthModal } = useAuth();

  if (!modalOpen) return null;

  return (
    <div className="auth-backdrop" onClick={closeAuthModal} role="dialog" aria-modal="true">
      <div
        className="auth-modal-window"
        onClick={(e) => e.stopPropagation()} // Prevent close on clicking inside modal
      >
        {/* CLOSE BUTTON */}
        <button
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Close authentication modal"
        >
          ✕
        </button>

        <div className="auth-modal-grid">
          {/* LEFT SECTION: BRANDING & VISUAL */}
          <div className="auth-visual-panel">
            <div className="visual-background-overlay" />
            <img src={mattressImg} alt="Somnera Luxury Mattress" className="visual-bg-image" />
            
            <div className="visual-content">
              <div className="brand-header">
                <img src={logo} alt="Somnera Logo" className="brand-logo" />
                <span className="brand-badge">SOMNERA SLEEP TECH</span>
              </div>

              <div className="visual-body">
                <h2>
                  Elegance in <em>Every Dream.</em>
                </h2>
                <p>
                  Experience handcrafted comfort, orthopaedic support, and zero motion transfer designed for deep restoration.
                </p>
              </div>

              <div className="visual-features">
                <div className="feature-pill">
                  <span className="feature-icon">✦</span> 100-Night Home Trial
                </div>
                <div className="feature-pill">
                  <span className="feature-icon">◈</span> 10-Year Extended Warranty
                </div>
                <div className="feature-pill">
                  <span className="feature-icon">⌁</span> Free Express Shipping
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: AUTH FORMS */}
          <div className="auth-form-panel">
            {modalView === 'login' && <LoginForm />}
            {modalView === 'register' && <RegisterForm />}
            {(modalView === 'forgot-password' || modalView === 'reset-password') && (
              <ForgotPasswordForm />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
