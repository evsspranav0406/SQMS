// pages/AdminDashboard.tsx

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminDashboard = () => {
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

        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-2">📦 Menu Items</h3>
            <p className="text-gray-600">Add, edit, or remove items on your restaurant’s menu.</p>
            <Link to="/admin/menu">
              <Button className="mt-4">Go to Menu</Button>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-2">📋 Reservations</h3>
            <p className="text-gray-600">View and manage all current reservations.</p>
            <Link to="/admin/reservations">
              <Button className="mt-4">View Reservations</Button>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-2">➕ Add Item</h3>
            <p className="text-gray-600">Quickly add a new item to the menu.</p>
            <Link to="/admin/menu/add">
              <Button className="mt-4">Add Menu Item</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
