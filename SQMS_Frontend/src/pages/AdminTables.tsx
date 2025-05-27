import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { Edit, Trash } from 'lucide-react';

interface Table {
  _id: string;
  tableNumber: string;
  capacity: number | string;
  status: string;
  currentReservation?: string;
}

const AdminTables = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{ tableNumber: string; capacity: string; status: string }>({ tableNumber: '', capacity: '', status: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert("No token found. Redirecting to login.");
      window.location.href = '/admin/login';
      return;
    }
    const fetchTables = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/tables', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTables(response.data);
      } catch (err) {
        setError('Failed to fetch tables');
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Get distinct statuses from tables data
  const statuses = useMemo(() => {
    const statusSet = new Set<string>();
    tables.forEach((table) => {
      if (table.status) {
        statusSet.add(table.status);
      }
    });
    return Array.from(statusSet);
  }, [tables]);

  // Filter tables by selected status
  const filteredTables = useMemo(() => {
    if (!selectedStatus) {
      return tables;
    }
    return tables.filter((table) => table.status === selectedStatus);
  }, [tables, selectedStatus]);

  const paginatedTables = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTables.slice(start, start + itemsPerPage);
  }, [filteredTables, currentPage]);

  const totalPages = Math.ceil(filteredTables.length / itemsPerPage);

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const exportToCSV = () => {
    const headers = ['Table Number', 'Status', 'Capacity', 'Current Reservation'];
    const rows = filteredTables.map(table => [
      table.tableNumber,
      table.status,
      table.capacity,
      table.currentReservation
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'filtered_table.csv';
    link.click();
  };

  const handleEditClick = (table) => {
    setEditingTableId(table._id);
    setEditFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
    });
    setActionError(null);
  };

  const handleCancelClick = () => {
    setEditingTableId(null);
    setEditFormData({ tableNumber: '', capacity: '', status: '' });
    setActionError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async (id) => {
    setActionLoading(true);
    setActionError(null);
    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.put(`http://localhost:5000/api/tables/${id}`, editFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTables(prev =>
        prev.map(table => (table._id === id ? response.data : table))
      );
      setEditingTableId(null);
      setEditFormData({ tableNumber: '', capacity: '', status: '' });
    } catch (error) {
      setActionError('Failed to update table');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    setActionLoading(true);
    setActionError(null);
    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`http://localhost:5000/api/tables/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTables(prev => prev.filter(table => table._id !== id));
    } catch (error) {
      setActionError('Failed to delete table');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen flex flex-col px-6 py-10 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-10">Manage Tables</h2>

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
            <Link to="/admin/tables/add">
              <Button className="bg-primary text-white px-6 py-2">Add Table</Button>
            </Link>
            <Button variant="outline" onClick={exportToCSV}>
              Export Filtered
            </Button>
          </div>
        </div>

        {loading && <p>Loading tables...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {actionError && <p className="text-red-500">{actionError}</p>}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto shadow-md rounded-lg bg-white">
              <table className="min-w-full table-auto text-left text-sm">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="py-3 px-6">Table Number</th>
                    <th className="py-3 px-6">Capacity</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Waiter Name</th>
                    <th className="py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {paginatedTables.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4">
                          No tables found.
                        </td>
                      </tr>
                    ) : (
                      paginatedTables.map((table) => (
                        <tr key={table._id as string} className="border-t hover:bg-gray-50">
                          {editingTableId === (table._id as string) ? (
                            <>
                              <td className="py-2 px-6">
                                <input
                                  type="text"
                                  name="tableNumber"
                                  value={editFormData.tableNumber}
                                  onChange={handleInputChange}
                                  className="border rounded px-2 py-1 w-full"
                                />
                              </td>
                              <td className="py-2 px-6">
                                <input
                                  type="number"
                                  name="capacity"
                                  value={editFormData.capacity}
                                  onChange={handleInputChange}
                                  className="border rounded px-2 py-1 w-full"
                                />
                              </td>
                              <td className="py-2 px-6">
                                <input
                                  type="text"
                                  name="status"
                                  value={editFormData.status}
                                  onChange={handleInputChange}
                                  className="border rounded px-2 py-1 w-full"
                                />
                              </td>
                              <td className="py-2 px-6 flex gap-2">
                                <button
                                  onClick={() => handleSaveClick(table._id as string)}
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
                          <td className="py-2 px-6">{table.tableNumber}</td>
                          <td className="py-2 px-6">{table.capacity}</td>
                          <td className="py-2 px-6">{table.status}</td>
                          <td className="py-2 px-6">{table.waiterName || 'N/A'}</td>
                          <td className="py-2 px-6 flex gap-2">
                          <Button
                            variant="outline"
                            className="text-blue-500"
                            onClick={() => handleEditClick(table)}
                            aria-label="Edit"
                          >
                            <Edit size={18} />
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-500"
                            onClick={() => handleDeleteClick(table._id as string)}
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

export default AdminTables;
