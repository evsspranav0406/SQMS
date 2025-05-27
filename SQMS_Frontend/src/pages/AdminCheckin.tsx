import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'sonner';
import QrScanner from 'react-qr-scanner';
import axios from 'axios';
import { isTokenValid } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const AdminCheckin = () => {
  const [scanning, setScanning] = useState(false);
  const [reservationData, setReservationData] = useState(null);
  const [reservationsList, setReservationsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleScan = async (data) => {
    if (data && !scanning && !reservationData) {
      setScanning(true);
      try {
        const qrData = typeof data === 'string' ? JSON.parse(data) : data;
        let parsedData = qrData;
        if (qrData.text) {
          try {
            parsedData = JSON.parse(qrData.text);
          } catch {
            parsedData = qrData;
          }
        }
        const reservationId = parsedData.id;
        if (!reservationId) {
          toast.error('Invalid QR code data: missing reservation ID');
          setScanning(false);
          return;
        }
        const token = localStorage.getItem('adminToken');
        if (!token || !isTokenValid(token)) {
          toast.error('Admin token missing or expired. Please login again.');
          navigate('/admin/login');
          setScanning(false);
          return;
        }
        try {
          const response = await axios.get(`http://localhost:5000/api/reservations/${reservationId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if(response.data.reservation.status ==='active')
          {
          setReservationData(response.data.reservation);
          }
          if(response.data.reservation.status === 'cancelled')
          {
            toast.error('No reservation found');
            setScanning(false)
          }
          if(response.data.reservation.status === 'completed')
          {
            toast.error('No reservation found');
            setScanning(false)
          }
          else{
            setScanning(false)
          }
        } catch (error) {
          if (error.response?.status === 400) {
            toast.error('Invalid or inactive reservation QR code');
          } else if (error.response?.status === 404) {
            toast.error('Reservation not found');
          } else {
            toast.error('Error validating reservation');
          }
          setScanning(false);
          return;
        }
      } catch (error) {
        toast.error('Failed to parse QR code');
        setScanning(false);
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
    toast.error('QR scan error');
  };

  const handleCheckin = async () => {
    if (!reservationData) return;
    const reservationId = reservationData._id;
    console.log(reservationId)
    if (!reservationId) {
      toast.error('Invalid reservation data');
      return;
    }
    const token = localStorage.getItem('adminToken');
    console.log(token)
    if (!token || !isTokenValid(token)) {
      toast.error('Admin token missing or expired. Please login again.');
      navigate('/admin/login');
      return;
    }
    try {
      // Send full reservationData for validation
      await axios.post(`http://localhost:5000/api/reservations/${reservationId}/checkin`, reservationData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Check-in successful');
      setReservationData(null);
      setScanning(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Check-in error:', error);
      if (error.response?.status === 401) {
        toast.error('Unauthorized. Please login again.');
        navigate('/admin/login');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Check-in failed');
      }
      setScanning(false);
    }
  };

  const handleCancel = () => {
    setReservationData(null);
    setScanning(false);
    setSearchQuery('');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter reservation ID, phone, or email');
      return;
    }
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    if (!token || !isTokenValid(token)) {
      toast.error('Admin token missing or expired. Please login again.');
      navigate('/admin/login');
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/search?query=${encodeURIComponent(searchQuery.trim())}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const reservations = response.data.reservations || [];
      if (reservations.length === 0) {
        toast.error('Reservation not found');
        setLoading(false);
        return;
      }
      // Filter active reservations
      const activeReservation = reservations.find(r => r.status === 'active');
      if (activeReservation) {
        setReservationData(activeReservation);
        setReservationsList(reservations);
      } else {
        toast.error('No active reservation found');
        setReservationData(null);
        setReservationsList(reservations);
      }
      setLoading(false);
    } catch (error) {
      console.error('Search error:', error);
      if (error.response?.status === 401) {
        toast.error('Unauthorized. Please login again.');
      } else if (error.response?.status === 404) {
        toast.error('Reservation not found');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Search failed');
      }
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen flex flex-col px-6 py-10 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-10">Customer Check-in</h2>
        {!reservationData ? (
          <div className="max-w-md mx-auto">
            <QrScanner
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%' }}
            />
            <div className="mt-4">
              <label htmlFor="searchInput" className="block mb-2 font-semibold">Or search reservation by ID, phone, or email:</label>
              <div className="flex">
                <input
                  id="searchInput"
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reservation ID, phone, or email"
                  disabled={loading}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">Reservation Details</h3>
              <p><strong>Name:</strong> {reservationData.name}</p>
              <p><strong>Guests:</strong> {reservationData.guests}</p>
              <p><strong>Date:</strong> {reservationData.date}</p>
              <p><strong>Time:</strong> {reservationData.time}</p>
              {reservationData.menu && reservationData.menu.length > 0 && (
                <>
                  <p className="mt-4 font-semibold">Menu:</p>
                  <ul className="list-disc list-inside">
                    {reservationData.menu.map((item, index) => (
                      <li key={index}>{item.name} x {item.quantity}</li>
                    ))}
                  </ul>
                </>
              )}
            <div className="mt-6 flex justify-between">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Check-in
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCheckin;
