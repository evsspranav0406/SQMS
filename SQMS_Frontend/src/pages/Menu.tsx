import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Menu = () => {
  const [menuData, setMenuData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isVegFilter, setIsVegFilter] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' for low to high, 'desc' for high to low

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/menu');
        const data = await res.json();
        setMenuData(data);
      } catch (err) {
        console.error('Error fetching menu:', err);
      }
    };

    fetchMenu();
  }, []);

  const allItems = Object.values(menuData).flat();

  const filterItems = (items) =>
    items.filter(
      (item) =>
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!isVegFilter || item.isVeg)
    );

  const sortItems = (items) => {
    return items.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.price - b.price; // low to high
      }
      return b.price - a.price; // high to low
    });
  };

  const getItemsForTab = () => {
    const items = activeTab === 'all' ? filterItems(allItems) : filterItems(menuData[activeTab] || []);
    return sortItems(items);
  };

  const getCategoryCount = (category) => {
    return menuData[category] ? menuData[category].length : 0;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Our Menu</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our delicious vegetarian dishes crafted with fresh ingredients and passion.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search our menu..."
                className="w-full pl-10 pr-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filters and Sorting */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={isVegFilter}
                  onChange={() => setIsVegFilter(!isVegFilter)}
                />
                Vegetarian Only
              </label>
            </div>
            <select
              className="border rounded-full py-2 px-4"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="flex flex-wrap justify-center gap-2">
              <TabsTrigger value="all">All ({allItems.length})</TabsTrigger>
              {Object.keys(menuData).map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category} ({getCategoryCount(category)})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getItemsForTab().map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  {item.isVeg && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                      Vegetarian
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    <span className="text-lg font-bold text-primary">
                      ₹{item.price}
                    </span>
                  </div>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* No Items Found */}
          {getItemsForTab().length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-2xl font-medium text-gray-600">No items found</h3>
              <p className="mt-2 text-gray-500">Try adjusting your search term</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Menu;
