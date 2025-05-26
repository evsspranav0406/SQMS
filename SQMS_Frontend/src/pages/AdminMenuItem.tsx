import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

const AddMenuItem = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');
  const [isVeg, setIsVeg] = useState(true);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newItem = { name, description, price, image, category, isVeg };

    try {
      await axios.post('http://localhost:5000/api/menu/add', newItem);
      toast.success('Menu item added successfully! 🍽️');
      setTimeout(() => navigate('/admin/menu'), 500);
    } catch (err) {
      console.error('Failed to add menu item:', err);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <AdminLayout>
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Add New Menu Item
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="text"
          placeholder="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          placeholder="Item Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <Input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          required
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-md"
          required
        >
          <option value="">Select Category</option>
          <option value="Appetizer">Appetizer</option>
          <option value="Main Dish">Main Dish</option>
          <option value="Dessert">Dessert</option>
          <option value="Drink">Drink</option>
          <option value="Biryani">Biryani</option>
          <option value="Flat Bread">Flat Bread</option>
        </select>

        <div className="flex items-center space-x-4">
          <label className="text-gray-700 font-medium">Vegetarian</label>
          <input
            type="checkbox"
            checked={isVeg}
            onChange={(e) => setIsVeg(e.target.checked)}
            className="h-5 w-5"
          />
        </div>

        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white px-8 py-3">
          Add Item
        </Button>
      </form>
    </div>
    </AdminLayout>
  );
};

export default AddMenuItem;
