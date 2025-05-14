import { Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

const AdminRoute = ({ children }) => {
  const user = useAuth();

  if (user === null) return <p>Not Authorized</p>;
  if (!user.isAdmin) return <Navigate to="/unauthorized" />;

  return children;
};

export default AdminRoute;
