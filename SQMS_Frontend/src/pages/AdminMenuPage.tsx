import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Edit, Trash, ArrowUpDown } from 'lucide-react';

type MenuItem = {
  _id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  category: string;
  isVeg: boolean;
  isFeatured?: boolean;
};

const AdminMenuPage = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof MenuItem | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editFormData, setEditFormData] = useState<MenuItem | null>(null);

  const itemsPerPage = 50;

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/menu');
        const data = response.data;
        setMenuItems(Array.isArray(data) ? data : Object.values(data).flat());
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };

    fetchMenuItems();
  }, []);

  const categoryList = useMemo(() => {
    return Array.from(new Set(menuItems.map(item => item.category)));
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter ? item.category === categoryFilter : true;

      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, categoryFilter]);

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      if (sortConfig.key === 'price') {
        return sortConfig.direction === 'asc'
          ? parseFloat(aVal as string) - parseFloat(bVal as string)
          : parseFloat(bVal as string) - parseFloat(aVal as string);
      }

      return sortConfig.direction === 'asc'
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    });
  }, [filteredItems, sortConfig]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, currentPage]);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/menu/${id}`);
      setMenuItems(menuItems.filter(item => item._id !== id));
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const handleSort = (key: keyof MenuItem) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleInlineEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditFormData({ ...item });
  };

  const handleInlineChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    if (type === 'checkbox') {
      setEditFormData(prevData => ({
        ...prevData!,
        [name]: checked,
      }));
    } else {
      setEditFormData(prevData => ({
        ...prevData!,
        [name]: value,
      }));
    }
  };

  const handleInlineSubmit = async (e: React.FormEvent, itemId: string) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/menu/${itemId}`, editFormData);
      setMenuItems(menuItems.map(item => (item._id === itemId ? { ...item, ...editFormData } : item)));
      setEditingItem(null);
      setEditFormData(null);
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Description', 'Price', 'Category', 'Vegetarian', 'Featured'];
    const rows = filteredItems.map(item => [
      item.name,
      item.description,
      item.price,
      item.category,
      item.isVeg ? 'Yes' : 'No',
      item.isFeatured ? 'Yes' : 'No',
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'filtered_menu.csv';
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col px-6 py-10 bg-gray-50">
      <h2 className="text-3xl font-bold text-center mb-10">Manage Menu</h2>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name or category..."
            className="border rounded-md px-4 py-2 w-full sm:w-80"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border rounded-md px-4 py-2"
          >
            <option value="">All Categories</option>
            {categoryList.map((cat, i) => (
              <option key={i} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <Button variant="outline" onClick={() => {
            setSearchQuery('');
            setCategoryFilter('');
          }}>
            Clear Filters
          </Button>
        </div>

        <div className="flex gap-2">
          <Link to="/admin/menu/add">
            <Button className="bg-primary text-white px-6 py-2">Add Menu Item</Button>
          </Link>
          <Button variant="outline" onClick={exportToCSV}>
            Export Filtered
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg bg-white">
        <table className="min-w-full table-auto text-left text-sm">
          <thead className="bg-primary text-white">
            <tr>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                Name <ArrowUpDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('price')}>
                Price <ArrowUpDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Vegetarian</th>
              <th className="py-3 px-4">Featured</th>
              <th className="py-3 px-4">Image</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map(item => (
              <tr key={item._id} className="border-t hover:bg-gray-50">
                <td className="py-2 px-4">
                  {editingItem?._id === item._id ? (
                    <input
                      type="text"
                      name="name"
                      value={editFormData?.name || ''}
                      onChange={handleInlineChange}
                      className="border rounded-md px-4 py-2 w-full"
                    />
                  ) : (
                    item.name
                  )}
                </td>
                <td className="py-2 px-4">
                  {editingItem?._id === item._id ? (
                    <textarea
                      name="description"
                      value={editFormData?.description || ''}
                      onChange={handleInlineChange}
                      className="border rounded-md px-4 py-2 w-full"
                    />
                  ) : (
                    item.description
                  )}
                </td>
                <td className="py-2 px-4">
                  {editingItem?._id === item._id ? (
                    <input
                      type="number"
                      name="price"
                      value={editFormData?.price || ''}
                      onChange={handleInlineChange}
                      className="border rounded-md px-4 py-2 w-full"
                    />
                  ) : (
                    `₹${item.price}`
                  )}
                </td>
                <td className="py-2 px-4">
                  {editingItem?._id === item._id ? (
                    <input
                      type="text"
                      name="category"
                      value={editFormData?.category || ''}
                      onChange={handleInlineChange}
                      className="border rounded-md px-4 py-2 w-full"
                    />
                  ) : (
                    item.category
                  )}
                </td>
                <td className="py-2 px-4">
                  {editingItem?._id === item._id ? (
                    <input
                      type="checkbox"
                      name="isVeg"
                      checked={editFormData?.isVeg || false}
                      onChange={handleInlineChange}
                    />
                  ) : (
                    item.isVeg ? 'Yes' : 'No'
                  )}
                </td>
                <td className="py-2 px-4">
                  {editingItem?._id === item._id ? (
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={editFormData?.isFeatured || false}
                      onChange={handleInlineChange}
                    />
                  ) : (
                    item.isFeatured ? 'Yes' : 'No'
                  )}
                </td>
                <td className="py-2 px-4">
                  {editingItem?._id === item._id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        name="image"
                        value={editFormData?.image || ''}
                        onChange={handleInlineChange}
                        className="border rounded-md px-4 py-2 w-full"
                        placeholder="Image URL"
                      />
                      {editFormData?.image && (
                        <img
                          src={editFormData.image}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                      )}
                    </div>
                  ) : item.image ? (
                    <img src={item.image} alt="Menu" className="w-16 h-16 object-cover rounded-md" />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </td>
                <td className="py-2 px-4">
                  <div className="flex gap-2">
                    {editingItem?._id === item._id ? (
                      <Button
                        variant="outline"
                        className="text-primary"
                        onClick={(e) => handleInlineSubmit(e, item._id)}
                      >
                        Save
                      </Button>
                    ) : (
                      <Button variant="outline" className="text-primary" onClick={() => handleInlineEdit(item)}>
                        <Edit size={18} />
                      </Button>
                    )}
                    <Button variant="outline" className="text-red-500" onClick={() => handleDelete(item._id)}>
                      <Trash size={18} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-center items-center gap-4">
        <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
          Previous
        </Button>
        <span>Page {currentPage}</span>
        <Button variant="outline" disabled={currentPage * itemsPerPage >= sortedItems.length} onClick={() => setCurrentPage(p => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default AdminMenuPage;
