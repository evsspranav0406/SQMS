import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { toast } from 'sonner';
import { toISTDateString } from '@/lib/utils';

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Initialize to today's date in yyyy-mm-dd format
    const today = new Date();
    return toISTDateString(today);
  });
  const itemsPerPage = 20;

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert("No token found. Redirecting to login.");
      window.location.href = '/admin/login';
      return;
    }

    const fetchReservations = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/admin/reservations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setReservations(data);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          alert("Unauthorized or forbidden. Redirecting to login.");
          window.location.href = '/admin/login';
        }
      }
    };

    fetchReservations();
  }, []);

  const filteredReservations = useMemo(() => {
    const filtered = reservations.filter((res) => {
      // Filter to show only upcoming reservations with status 'active' or 'pending'
      //if (!['active', 'checked-in','completed'].includes(res.status)) {
      //  return false;
      //}
      // Filter by selected date
      if (!res.date || res.date.substring(0, 10) !== selectedDate) {
        return false;
      }
      const matchesSearch =
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.phone.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [reservations, searchQuery, selectedDate]);

  const paginatedReservations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReservations.slice(start, start + itemsPerPage);
  }, [filteredReservations, currentPage]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredReservations.length / itemsPerPage)));
  };

  return (
    <AdminLayout>
      <div className="min-h-screen flex flex-col px-6 py-10 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-10">Manage Reservations</h2>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="border rounded-md px-4 py-2 w-full sm:w-80"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <input
            type="date"
            className="border rounded-md px-4 py-2 w-full sm:w-48"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="overflow-x-auto shadow-md rounded-lg bg-white">
          <table className="min-w-full table-auto text-left text-sm">
            <thead className="bg-primary text-white">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Guests</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-8">Menu Items</th>
                <th className="py-3 px-4">Payment Amount</th>
                <th className="py-3 px-4">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReservations.map((res) => (
                <tr key={res._id} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">{res.name}</td>
                  <td className="py-2 px-4">{res.email}</td>
                  <td className="py-2 px-4">{res.phone}</td>
                  <td className="py-2 px-4">{res.date ? res.date.substring(0, 10) : ''}</td>
                  <td className="py-2 px-4">{res.time}</td>
                  <td className="py-2 px-4">{res.guests}</td>
                  <td className="py-2 px-4">{res.status}</td>
                  <td className="py-2 px-12 max-w-xs break-words">
                    {res.menu && res.menu.length > 0 ? (
                      <div>
                        {res.menu.map((item, index) => (
                          <div key={index}>{item.name} x {item.quantity}</div>
                        ))}
                      </div>
                    ) : (
                      'None'
                    )}
                  </td>
                  <td className="py-2 px-4">{res.payment?.amount ? `₹${res.payment.amount.toFixed(2)}` : 'N/A'}</td>
                  <td className="py-2 px-4">{res.payment?.status || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center items-center gap-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {currentPage} of {Math.ceil(filteredReservations.length / itemsPerPage)}</span>
          <button
            onClick={handleNextPage}
            disabled={currentPage * itemsPerPage >= filteredReservations.length}
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReservations;
