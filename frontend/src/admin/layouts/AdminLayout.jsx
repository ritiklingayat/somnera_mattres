import { adminNavigation } from '../constants/navigation';

export default function AdminLayout({ activeRoute, onNavigate, onLogout, children }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/">
          <b>S</b>
          <span>
            somnera<small>ADMIN CONSOLE</small>
          </span>
        </a>
        <nav>
          {adminNavigation.map(([route, label]) => (
            <button
              key={route}
              className={activeRoute === route ? 'active' : ''}
              onClick={() => onNavigate(route)}
            >
              <i>{label[0]}</i>
              {label}
            </button>
          ))}
        </nav>
        <div className="admin-profile">
          <b>A</b>
          <span>
            Somnera Admin<small>Administrator</small>
          </span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
