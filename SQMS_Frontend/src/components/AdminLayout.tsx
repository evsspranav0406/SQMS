import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [adminName, setAdminName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('admin');

    if (!token || !admin) {
      toast.error('Unauthorized access');
      navigate('/admin/login');
    } else {
      const parsedAdmin = JSON.parse(admin);
      setAdminName(parsedAdmin.name || 'Admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col py-8 px-6">
        <h2 className="text-2xl font-bold mb-10 text-center">Admin Panel</h2>
        <nav className="flex flex-col space-y-4">
          <Link to="/admin/dashboard" className="hover:text-primary">
            📊 Home
          </Link>
          <Link to="/admin/menu" className="hover:text-primary">
            🧾 Menu Management
          </Link>
          <Link to="/admin/reservations" className="hover:text-primary">
            📅 Reservations
          </Link>
          <Link to="/admin/menu/add" className="hover:text-primary">
            ➕ Add Menu Item
          </Link>
          <Link to="/admin/checkin" className="hover:text-primary">
            📷 Scan QR
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 bg-gray-100 p-6">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Welcome, {adminName} 👋</h1>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
