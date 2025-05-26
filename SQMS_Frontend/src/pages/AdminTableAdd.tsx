import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import { error } from 'console';

const AdminTableAdd = () => {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState<number | string>('');
  const [isavailable, setisavailable] = useState(true); // default status as Available

  const navigate = useNavigate();

  useEffect(() => {
    setisavailable(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newTable = { tableNumber, capacity, isavailable };

    try {
      await axios.post('http://localhost:5000/api/tables/', newTable);
      toast.success('Table added successfully!');
      setTimeout(() => navigate('/admin/tables'), 500);
    } catch (err) {
      console.error('Failed to add table:', err);
      toast.error(err.response.data)
      if (err.response && err.response.data) {
        console.log('Error response data:', err.response.data);
        if (err.response.data.error) {
          toast.error(err.response.data.error);
        } else {
          toast.error('Something went wrong. Please try again.');
        }
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-md mt-10">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Add New Table
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            placeholder="Table Number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            required
          />
          <Input
            type="number"
            placeholder="Capacity"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
          />
        <div className="flex items-center space-x-4">
          <label className="text-gray-700 font-medium">Availble</label>
          <input
            type="checkbox"
            checked={isavailable}
            onChange={(e) => setisavailable(e.target.checked)}
            className="h-5 w-5"
          />
        </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white px-8 py-3">
            Add Table
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminTableAdd;
