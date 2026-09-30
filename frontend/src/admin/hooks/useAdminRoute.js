import { useEffect, useState } from 'react';

const defaultRoute = 'overview';
const getRoute = () => {
  const hash = (window.location.hash || '').replace(/^#\/?/, '').trim();
  if (hash) {
    if (hash.startsWith('admin/')) {
      return hash.replace('admin/', '').split('?')[0] || defaultRoute;
    }
    return hash.split('?')[0];
  }
  const path = (window.location.pathname || '').replace(/^\//, '').trim();
  if (path.startsWith('admin/')) {
    const sub = path.replace('admin/', '').split('/')[0].split('?')[0];
    if (sub) return sub;
  }
  return defaultRoute;
};

export default function useAdminRoute() {
  const [route, setRoute] = useState(getRoute);
  useEffect(() => {
    const syncRoute = () => setRoute(getRoute());
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);
  const navigate = (nextRoute) => {
    window.location.hash = nextRoute;
    setRoute(nextRoute);
  };
  return [route, navigate];
}

