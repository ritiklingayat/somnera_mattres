import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './AccountDropdown.css';

export default function AccountDropdown({ onNavigate }) {
  const { user, isLoggedIn, openAuthModal, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    if (action === 'login') {
      openAuthModal('login');
    } else if (action === 'register') {
      openAuthModal('register');
    } else if (action === 'orders') {
      onNavigate?.('orders');
    } else if (action === 'profile') {
      onNavigate?.('profile');
    } else if (action === 'logout') {
      logout();
    }
  };

  return (
    <div className="account-dropdown-wrapper" ref={dropdownRef}>
      <button
        className={`account-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Account menu"
      >
        <div className="account-avatar-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div className="account-label-text">
          <span className="sub-label">{isLoggedIn ? 'Welcome' : 'Account'}</span>
          <strong className="main-label">
            {isLoggedIn ? user?.firstName || 'My Account' : 'Login / Sign Up'}
          </strong>
        </div>

        <svg
          className={`chevron-icon ${isOpen ? 'rotated' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="account-menu-popover" onMouseLeave={() => setIsOpen(false)}>
          <div className="popover-caret" />

          {!isLoggedIn ? (
            <div className="popover-content unauth-menu">
              <div className="menu-header-prompt">
                <span>Welcome to Somnera</span>
                <p>Access your orders, wishlist, and rewards.</p>
              </div>
              <div className="action-buttons">
                <button className="menu-btn-primary" onClick={() => handleAction('login')}>
                  Login
                </button>
                <button className="menu-btn-secondary" onClick={() => handleAction('register')}>
                  Create Account
                </button>
              </div>
            </div>
          ) : (
            <div className="popover-content auth-menu">
              <div className="user-profile-summary">
                <div className="user-initials">
                  {(user?.firstName || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>
                    {user?.firstName} {user?.lastName}
                  </strong>
                  <small>{user?.email}</small>
                </div>
              </div>

              <div className="menu-divider" />

              <nav className="account-nav-list">
                <button onClick={() => handleAction('orders')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  My Orders
                </button>
                <button onClick={() => handleAction('profile')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  My Profile
                </button>
              </nav>

              <div className="menu-divider" />

              <button className="logout-btn" onClick={() => handleAction('logout')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
