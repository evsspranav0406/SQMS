import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Button } from '@/components/ui/button';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface MenuModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (cartItems: CartItem[]) => void;
  onSkip: () => void;
  initialCartItems?: CartItem[];
  enableConfirmWhenEmpty?: boolean;
}

const MenuModal: React.FC<MenuModalProps> = ({ open, onClose, onConfirm, onSkip, initialCartItems, enableConfirmWhenEmpty = false }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterVeg, setFilterVeg] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      fetchMenu();
    }
  }, [open]);

  useEffect(() => {
    if (initialCartItems) {
      // Replace cart state entirely with initialCartItems to avoid stale merges
      setCart(initialCartItems);
      console.log('MenuModal: cart state replaced from initialCartItems', initialCartItems);
    }
  }, [initialCartItems]);

  const fetchMenu = async () => {
    setLoading(true); 
    try {
      const res = await fetch('http://localhost:5000/api/menu');
      const data = await res.json();
      // Flatten all categories into one array and cast to MenuItem[]
      const allItems = Object.values(data).flat() as MenuItem[];
      setMenuItems(allItems);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci._id === item._id);
      if (existing) {
        return prevCart.map((ci) =>
          ci._id === item._id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((ci) => ci._id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prevCart) =>
      prevCart.map((ci) => (ci._id === itemId ? { ...ci, quantity } : ci))
    );
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleConfirm = () => {
    onConfirm(cart);
    setCart([]);
  };

  const handleClose = () => {
    setCart([]);
    onClose();
  };

  // Helper to get quantity of item in cart
  const getQuantity = (itemId: string) => {
    const cartItem = cart.find((ci) => ci._id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Filter menu items based on search query and vegetarian filter
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = filterVeg ? item.isVeg : true;
    return matchesSearch && matchesVeg;
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
      <DialogTitle>Select Menu Items</DialogTitle>
      <DialogContent dividers className="relative">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading menu...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border rounded px-3 py-2 w-1/2"
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filterVeg}
                  onChange={(e) => setFilterVeg(e.target.checked)}
                  className="form-checkbox"
                />
                <span>Vegetarian Only</span>
              </label>
              <Button size="sm" variant="destructive" onClick={clearCart}>
                Clear Cart
              </Button>
            </div>
            <div className="flex flex-row gap-6">
              <div className="w-2/3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[600px]">
                {filteredMenuItems.map((item) => {
                  const quantity = getQuantity(item._id);
                  return (
                    <div key={item._id} className="border rounded p-4 flex flex-col">
                      <img src={item.image} alt={item.name} className="h-32 w-full object-cover mb-2 rounded" />
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600 flex-grow">{item.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold">₹{item.price}</span>
                        {quantity === 0 ? (
                          <Button size="sm" onClick={() => addToCart(item)}>
                            Add to Cart
                          </Button>
                        ) : (
                          <div className="flex items-center space-x-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => updateQuantity(item._id, quantity - 1)}>-</Button>
                            <span className="px-3 py-1 bg-gray-200 rounded text-center min-w-[32px]">{quantity}</span>
                            <Button size="sm" variant="outline" onClick={() => updateQuantity(item._id, quantity + 1)}>+</Button>
                            <Button size="sm" variant="destructive" onClick={() => removeFromCart(item._id)}>
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="w-1/3 border-l pl-4 overflow-y-auto max-h-[600px]">
                <h3 className="text-xl font-semibold mb-2">Your Cart</h3>
                {cart.length === 0 ? (
                  <p>Your cart is empty.</p>
                ) : (
                  <div>
                    {cart.map((item) => (
                      <div key={item._id} className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">₹{item.price} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="px-2 py-1 border rounded"
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            -
                          </button>
                          <button
                            className="px-2 py-1 border rounded"
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            +
                          </button>
                          <button
                            className="px-2 py-1 border rounded text-red-600"
                            onClick={() => removeFromCart(item._id)}
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="font-bold mt-4">Total: ₹{totalPrice.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={!enableConfirmWhenEmpty && cart.length === 0}>
          Confirm
        </Button>
        <Button onClick={onSkip} variant="ghost">
          Skip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MenuModal;
