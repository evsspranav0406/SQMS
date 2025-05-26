import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

const AdminWaiterAdd = () => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('available');
  const [currentTableCount, setCurrentTableCount] = useState(0);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newWaiter = { name, status, currentTableCount };

    const token = localStorage.getItem('adminToken');
    if (!token) {
      toast.error('No admin token found. Please login again.');
      navigate('/admin/login');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/waiters/', newWaiter, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      toast.success('Waiter added successfully!');
      setTimeout(() => navigate('/admin/waiters'), 500);
    } catch (err) {
      console.error('Failed to add waiter:', err);
      if (err.response && err.response.data && err.response.data.error) {
      toast.error(err.response.data.error);
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-md mt-10">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Add New Waiter
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label className="block mb-1 font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="available">available</option>
              <option value="occupied">occupied</option>
            </select>
          </div>
          <Input
            type="number"
            placeholder="Current Allocated Tables"
            value={currentTableCount}
            onChange={(e) => setCurrentTableCount(Number(e.target.value))}
            min={0}
            required
          />
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white px-8 py-3">
            Add Waiter
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminWaiterAdd;
