import { useAuth } from './AuthContext';

export default function LogoutModal() {
  const { logoutModalOpen, cancelLogout, logout, user } = useAuth();

  if (!logoutModalOpen) return null;

  return (
    <div className="auth-modal-backdrop" onClick={cancelLogout}>
      <div
        className="logout-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close-btn" onClick={cancelLogout} aria-label="Close">
          ×
        </button>
        <div className="logout-modal-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h2 id="logout-modal-title">Log out of your account?</h2>
        <p>
          {user?.firstName ? `${user.firstName}, you` : 'You'} will need to sign in again to access your orders,
          wishlist and rewards.
        </p>
        <div className="logout-modal-actions">
          <button type="button" className="menu-btn-secondary" onClick={cancelLogout}>
            Cancel
          </button>
          <button type="button" className="logout-confirm-btn" onClick={logout}>
            Yes, Log out
          </button>
        </div>
      </div>
    </div>
  );
}
