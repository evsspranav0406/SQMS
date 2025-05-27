import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Edit, Trash } from 'lucide-react';

interface Waiter {
  currentReservationId: any;
  _id: string;
  name: string;
  status: string;
  currentTableCount: number;
  phone?: string;
  email?: string;
}

interface EditFormData {
  name: string;
  status: string;
  currentTableCount: number;
  phone?: string;
  email?: string;
}

const AdminWaiters = () => {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editingWaiterId, setEditingWaiterId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({ name: '', status: 'available', currentTableCount: 0 });
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert("No token found. Redirecting to login.");
      window.location.href = '/admin/login';
      return;
    }
    const fetchWaiters = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/waiters', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Fetched waiters:', response.data);
        setWaiters(response.data);
      } catch (err) {
        setError('Failed to fetch waiters');
      } finally {
        setLoading(false);
      }
    };

    fetchWaiters();
  }, []);

  // Filter waiters by selected status (if applicable, else no filter)
  // Assuming waiters may have a status field, else this can be removed or adapted
  const statuses = useMemo(() => {
    const statusSet = new Set<string>();
    waiters.forEach((waiter) => {
      if (waiter.status) {
        statusSet.add(waiter.status);
      }
    });
    return Array.from(statusSet);
  }, [waiters]);

  const filteredWaiters = useMemo(() => {
    if (!selectedStatus) {
      return waiters;
    }
    return waiters.filter((waiter) => waiter.status === selectedStatus);
  }, [waiters, selectedStatus]);

  const paginatedWaiters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWaiters.slice(start, start + itemsPerPage);
  }, [filteredWaiters, currentPage]);

  const totalPages = Math.ceil(filteredWaiters.length / itemsPerPage);

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Status', 'Current Allocated Tables'];
    const rows = filteredWaiters.map(waiter => [
      waiter.name,
      waiter.status || '',
      waiter.currentTableCount || 0
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'filtered_waiters.csv';
    link.click();
  };

  const handleEditClick = (waiter) => {
    setEditingWaiterId(waiter._id);
    setEditFormData({
      name: waiter.name,
      status: waiter.status || 'available',
      currentTableCount: waiter.currentTableCount || 0,
    });
    setActionError(null);
  };

  const handleCancelClick = () => {
    setEditingWaiterId(null);
    setEditFormData({ name: '', status: 'available', currentTableCount: 0 });
    setActionError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async (id: string) => {
    setActionLoading(true);
    setActionError(null);
    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.put(`http://localhost:5000/api/waiters/${id}`, editFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWaiters(prev =>
        prev.map(waiter => (waiter._id === id ? response.data : waiter))
      );
      setEditingWaiterId(null);
      setEditFormData({ name: '', status: 'available', currentTableCount: 0 });
    } catch (error) {
      setActionError('Failed to update waiter');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this waiter?')) return;
    setActionLoading(true);
    setActionError(null);
    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`http://localhost:5000/api/waiters/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWaiters(prev => prev.filter(waiter => waiter._id !== id));
    } catch (error) {
      setActionError('Failed to delete waiter');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen flex flex-col px-6 py-10 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-10">Manage Waiters</h2>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="border rounded-md px-4 py-2 w-full sm:w-80"
          >
            <option value="">Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Link to="/admin/waiters/add">
              <Button className="bg-primary text-white px-6 py-2">Add Waiter</Button>
            </Link>
            <Button variant="outline" onClick={exportToCSV}>
              Export Filtered
            </Button>
          </div>
        </div>

        {loading && <p>Loading waiters...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {actionError && <p className="text-red-500">{actionError}</p>}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto shadow-md rounded-lg bg-white">
              <table className="min-w-full table-auto text-left text-sm">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Current Allocated Tables</th>
                    <th className="py-3 px-6">Current Table Number</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
                {paginatedWaiters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      No waiters found.
                    </td>
                  </tr>
                ) : (
                  paginatedWaiters.map((waiter) => (
                    <tr key={waiter._id} className="border-t hover:bg-gray-50">
                      {editingWaiterId === waiter._id ? (
                        <>
                          <td className="py-2 px-6">
                            <input
                              type="text"
                              name="name"
                              value={editFormData.name}
                              onChange={handleInputChange}
                              className="border rounded px-2 py-1 w-full"
                            />
                          </td>
                          <td className="py-2 px-6">
                            <select
                              name="status"
                              value={editFormData.status}
                              onChange={handleInputChange}
                              className="border rounded px-2 py-1 w-full"
                            >
                              <option value="available">available</option>
                              <option value="occupied">occupied</option>
                            </select>
                          </td>
                          <td className="py-2 px-6">
                            <input
                              type="number"
                              name="currentTableCount"
                              value={editFormData.currentTableCount}
                              onChange={handleInputChange}
                              className="border rounded px-2 py-1 w-full"
                              min={0}
                            />
                          </td>
                          <td className="py-2 px-6">
                            {waiter.currentTables && waiter.currentTables.length > 0
                              ? waiter.currentTables.join(', ')
                              : 'N/A'}
                          </td>
                          <td className="py-2 px-6 flex gap-2">
                            <button
                              onClick={() => handleSaveClick(waiter._id)}
                              disabled={actionLoading}
                              className="bg-green-500 text-white px-3 py-1 rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelClick}
                              disabled={actionLoading}
                              className="bg-gray-400 text-white px-3 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-6">{waiter.name}</td>
                          <td className="py-2 px-6">{waiter.status}</td>
                          <td className="py-2 px-6">{waiter.currentTableCount}</td>
                          <td className="py-2 px-6">
                            {waiter.currentTables && waiter.currentTables.length > 0
                              ? waiter.currentTables.join(', ')
                              : 'N/A'}
                          </td>
                          <td className="py-2 px-6 flex gap-2">
                            <Button
                              variant="outline"
                              className="text-blue-500"
                              onClick={() => handleEditClick(waiter)}
                              aria-label="Edit"
                            >
                              <Edit size={18} />
                            </Button>
                            <Button
                              variant="outline"
                              className="text-red-500"
                              onClick={() => handleDeleteClick(waiter._id)}
                              aria-label="Delete"
                            >
                              <Trash size={18} />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
            </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-center items-center gap-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminWaiters;
