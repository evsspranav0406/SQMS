import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReservationAnalyticsChart from '../components/ui/ReservationAnalyticsChart';
import FinancialAnalyticsChart from '../components/ui/FinancialAnalyticsChart';


const AdminDashboard = () => {
  const navigate = useNavigate();

  const [dashboardStatus, setDashboardStatus] = useState(null);
  const [reservationAnalytics, setReservationAnalytics] = useState([]);
  const [financialAnalytics, setFinancialAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const [statusResponse, analyticsResponse, financialResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/dashboard/status', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/admin/dashboard/reservation-analytics', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/admin/dashboard/financial-analytics', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setDashboardStatus(statusResponse.data);
        console.log(statusResponse.data)
        setReservationAnalytics(analyticsResponse.data);
        setFinancialAnalytics(financialResponse.data);
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <AdminLayout>
      {/* New Dashboard Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 col-span-1 md:col-span-2 xl:col-span-3 relative">
        <h3 className="text-xl font-semibold mb-4">📊 Current Status Overview</h3>
        <div className="absolute top-4 right-4 text-sm text-gray-500">
          {currentTime.toLocaleString()}
        </div>
        {loading && <p>Loading status...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {dashboardStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <h4 className="font-semibold mb-2">Tables</h4>
              <p>Total: {dashboardStatus.tables.total}</p>
              {Object.entries(dashboardStatus.tables.statusCounts).map(([status, count]) => (
                <p key={status}>{status}: {count}</p>
              ))}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Waiters</h4>
              <p>Total: {dashboardStatus.waiters.total}</p>
              {Object.entries(dashboardStatus.waiters.statusCounts).map(([status, count]) => (
                <p key={status}>{status}: {count}</p>
              ))}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Reservations</h4>
              <p>Total: {dashboardStatus.reservations.total}</p>
              <p>Checked-in: {dashboardStatus.reservations.checkedIn}</p>
              <p>Upcoming: {dashboardStatus.reservations.upcoming}</p>
              <p>Completed: {dashboardStatus.reservations.completed}</p>
            </div>
          </div>
        )}
      </div>
      <br />
      {/* Reservation Analytics Chart */}
      <div className="flex space-x-4">
        <div className="bg-white rounded-lg shadow-md p-6 w-1/2">
          <h3 className="text-xl font-semibold mb-4">📈 Reservation Analytics (Last 30 Days)</h3>
          {loading && <p>Loading analytics...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && reservationAnalytics.length > 0 && (
            <ReservationAnalyticsChart data={reservationAnalytics} />
          )}
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 w-1/2">
          <h3 className="text-xl font-semibold mb-4">💰 Financial Analytics (Last 30 Days)</h3>
          {loading && <p>Loading financial analytics...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && financialAnalytics.length > 0 && (
            <FinancialAnalyticsChart data={financialAnalytics} />
          )}
        </div>
      </div>
      <br></br>
      {/* Other dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">📦 Menu Items</h3>
          <p className="text-gray-600">Add, edit, or remove items on your restaurant’s menu.</p>
          <a href="/admin/menu" className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded">Go to Menu</a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">📋 Reservations</h3>
          <p className="text-gray-600">View and manage all current reservations.</p>
          <a href="/admin/reservations" className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded">View Reservations</a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">➕ Add Item</h3>
          <p className="text-gray-600">Quickly add a new item to the menu.</p>
          <a href="/admin/menu/add" className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded">Add Menu Item</a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">📷 Scan QR</h3>
          <p className="text-gray-600">Scan QR for checkin</p>
          <button
            onClick={() => navigate('/admin/checkin')}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
          >
            Scan QR for Check-in
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">🪑 Tables</h3>
          <p className="text-gray-600">View and manage restaurant tables.</p>
          <button
            onClick={() => navigate('/admin/tables')}
            className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded"
          >
            Go to Tables
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">👨‍🍳 Waiters</h3>
          <p className="text-gray-600">View and manage waiters.</p>
          <button
            onClick={() => navigate('/admin/waiters')}
            className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded"
          >
            Go to Waiters
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
