import { useEffect, useState } from 'react';

const defaultRoute = 'overview';
const getRoute = () => window.location.hash.replace('#', '') || defaultRoute;

export default function useAdminRoute() {
  const [route, setRoute] = useState(getRoute);
  useEffect(() => { const syncRoute = () => setRoute(getRoute()); window.addEventListener('hashchange', syncRoute); return () => window.removeEventListener('hashchange', syncRoute); }, []);
  const navigate = (nextRoute) => { window.location.hash = nextRoute; setRoute(nextRoute); };
  return [route, navigate];
}
