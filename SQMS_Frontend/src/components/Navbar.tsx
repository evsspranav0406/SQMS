import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Menu, X, Bell } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';
import axios from 'axios';

// Extend JwtPayload type to include 'name' and 'username'
interface DecodedToken {
  userId: string;
  name: string;
  username: string;
  exp: number;
  iat: number;
}

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
  autoConnect: false,
});

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUsername(decoded.name || decoded.username);

        // Connect socket and join room
        socket.auth = { token };
        socket.connect();
        socket.emit('joinRoom', decoded.userId);

        // Fetch initial notifications
        fetchNotifications(token);

        // Listen for real-time notifications
        socket.on('notification', (notification: Notification) => {
          setNotifications((prev) => [notification, ...prev]);
        });

        return () => {
          socket.off('notification');
          socket.disconnect();
        };
      } catch (err) {
        console.error('Invalid token', err);
        localStorage.removeItem('token');
        setUsername(null);
      }
    }
  }, []);

  const fetchNotifications = async (token: string) => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUsername(null);
    navigate('/');
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.isRead).length : 0;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <nav className="bg-white/90 backdrop-blur-sm fixed w-full z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img className="h-10 w-auto" src="/foodtechie logo.jpeg" alt="Food Techie" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary transition-colors">Home</Link>
            <Link to="/menu" className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary transition-colors">Menu</Link>
            <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary transition-colors">About Us</Link>
            <Link to="/reserve" className="px-3 py-2 rounded-md text-sm font-medium hover:text-primary transition-colors">Reserve Table</Link>

            {username ? (
              <>
                <span className="text-sm font-medium text-gray-600">Welcome, {username}</span>
                <div className="relative">
                  <button
                    onClick={toggleNotifications}
                    className="relative p-2 rounded-full hover:bg-gray-200 focus:outline-none"
                    aria-label="Notifications"
                  >
                    <Bell className="h-6 w-6 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg z-50">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">No notifications</div>
                      ) : (
                        notifications.map((notification) => (
                          <div key={notification._id} className="p-3 border-b border-gray-200">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="ml-4 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="outline" className="ml-4 border-primary text-primary hover:bg-primary hover:text-white">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-secondary hover:bg-primary/10 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary/10 hover:text-primary">Home</Link>
            <Link to="/menu" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary/10 hover:text-primary">Menu</Link>
            <Link to="/about" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary/10 hover:text-primary">About Us</Link>
            <Link to="/reserve" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary/10 hover:text-primary">Reserve Table</Link>

            {username ? (
              <>
                <span className="block px-3 py-2 text-base font-medium text-gray-600">Welcome, {username}</span>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-red-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary/10 hover:text-primary">Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
