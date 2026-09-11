import { Navigate } from 'react-router-dom';
import { useAuth } from '../components/Account';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return children;
}
