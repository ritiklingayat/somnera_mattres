import { useAuth } from '../../components/Account';
import './Account.css';

const links = [
  { to: 'profile', label: 'My Profile', icon: '👤' },
  { to: 'orders', label: 'My Orders', icon: '📦' },
];

export default function AccountLayout({ active, children }) {
  const { user } = useAuth();
  return (
    <div className="account-page">
      <div className="container account-layout">
        <aside className="account-sidebar">
          <div className="account-sidebar-head">
            <div className="account-avatar-large">
              {(user?.firstName || 'S').charAt(0).toUpperCase()}
            </div>
            <strong>
              {user?.firstName} {user?.lastName}
            </strong>
            <small>{user?.email}</small>
          </div>
          <nav className="account-sidebar-nav">
            {links.map((l) => (
              <a
                key={l.to}
                href={`#${l.to}`}
                className={active === l.to ? 'active' : ''}
              >
                <span>{l.icon}</span>
                {l.label}
              </a>
            ))}
          </nav>
        </aside>
        <main className="account-content">{children}</main>
      </div>
    </div>
  );
}
