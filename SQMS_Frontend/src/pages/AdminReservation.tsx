// pages/AdminReservations.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    console.log('Admin Token:', token);

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
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading reservations...</p>;

  return (
    <div className="min-h-screen py-10 px-6">
      <h2 className="text-2xl font-bold mb-6 text-center">All Reservations</h2>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((res) => (
              <TableRow key={res._id}>
                <TableCell>{res.name}</TableCell>
                <TableCell>{res.email}</TableCell>
                <TableCell>{res.phone}</TableCell>
                <TableCell>{res.date ? res.date.substring(0, 10) : ''}</TableCell>
                <TableCell>{res.time}</TableCell>
                <TableCell>{res.guests}</TableCell>
                <TableCell>{res.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminReservations;
