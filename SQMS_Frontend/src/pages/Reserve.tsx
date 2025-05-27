import { useState, useEffect } from 'react';
import { format, parseISO, isBefore, startOfDay, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BanIcon, CalendarDays, Clock, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import axios, { AxiosError } from 'axios';
import {jwtDecode} from 'jwt-decode';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import MenuModal from '@/components/MenuModal';
import FeedbackModal from '@/components/FeedbackModal';
import { Close } from '@radix-ui/react-toast';
import { Cancel } from '@radix-ui/react-alert-dialog';

interface DecodedToken {
  id: string;
}

interface CartItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  quantity: number;
}

import { useNavigate } from 'react-router-dom';

const ReservePage = () => {
  const navigate = useNavigate();

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('');
  const [guests, setGuests] = useState<string>(''); // Start as empty string
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [hasReservation, setHasReservation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  // New state to store original reservation data for cancel edit revert
  const [originalReservation, setOriginalReservation] = useState<{
    date: Date | undefined;
    time: string;
    guests: string;
    specialRequests: string;
    cartItems: CartItem[];
  } | null>(null);

  // New state to store full reservation object including table and waiter info
  const [reservation, setReservation] = useState<{
    status?: string;
    table?: { tableNumber: string };
    waiter?: { name: string };
    [key: string]: unknown;
  } | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Initialize cartItems from localStorage if available
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Ensure cartItems are saved to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // When editing starts, ensure cartItems are set from originalReservation menu if available
  useEffect(() => {
    if (isEditing && originalReservation && originalReservation.cartItems) {
      setCartItems(originalReservation.cartItems);
    }
  }, [isEditing, originalReservation]);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openPreBookDialog, setOpenPreBookDialog] = useState(false);

  // New state for cancel edit confirmation dialog
  const [openCancelEditConfirmDialog, setOpenCancelEditConfirmDialog] = useState(false);

  // New state for edit reservation choice dialog
  const [openEditChoiceDialog, setOpenEditChoiceDialog] = useState(false);

  // Function to check if form data has changed compared to originalReservation
  const hasChanges = () => {
    if (!originalReservation) return false;
    if (!date || !originalReservation.date) return true;
    if (date.getTime() !== originalReservation.date.getTime()) return true;
    if (time !== originalReservation.time) return true;
    if (guests !== originalReservation.guests) return true;
    if (specialRequests !== originalReservation.specialRequests) return true;
    if (cartItems.length !== originalReservation.cartItems.length) return true;
    // Check cart items by _id and quantity
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      const origItem = originalReservation.cartItems.find(ci => ci._id === item._id);
      if (!origItem || origItem.quantity !== item.quantity) return true;
    }
    return false;
  };

  // Handler for Cancel Edit button click
  const handleCancelEditClick = () => {
    if (hasChanges()) {
      setOpenCancelEditConfirmDialog(true);
    } else {
      // No changes, just cancel edit
      setIsEditing(false);
    }
  };

  // Confirm cancel edit and revert changes
  const confirmCancelEdit = () => {
    if (originalReservation) {
      setDate(originalReservation.date);
      setTime(originalReservation.time);
      setGuests(originalReservation.guests);
      setSpecialRequests(originalReservation.specialRequests);
      setCartItems(originalReservation.cartItems ? [...originalReservation.cartItems] : []);
    }
    setIsEditing(false);
    setOpenCancelEditConfirmDialog(false);
  };

  // Cancel cancel edit confirmation dialog
  const cancelCancelEdit = () => {
    setOpenCancelEditConfirmDialog(false);
  };

  const thirtyDaysFromNow = addDays(new Date(), 30);

  // Extract fetchData function for reuse
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be logged in to reserve.');
      window.location.href = '/login';
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const userRes = await axios.get(`http://localhost:5000/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = userRes.data;
      setName(user.name);
      setEmail(user.email);
      setPhone(String(user.phone));

      const res = await axios.get('http://localhost:5000/api/reservations/my', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.reservation) {
        const r = res.data.reservation;
        setDate(parseISO(r.date));
        setTime(r.time);
        setGuests(r.guests ? String(r.guests) : '1');
        setSpecialRequests(r.specialRequests || '');
        setQrCode(r.qrCode);
        setReservationId(r._id);
        setHasReservation(true);
        setReservation(r); // store full reservation object including table and waiter
        const restoredCartItems = (r.menu || []).map((item: { _id: string; name: string; description: string; price: number; image: string; isVeg: boolean; quantity?: number }) => ({
          ...item,
          quantity: item.quantity || 1,
        }));
        console.log('Restored cartItems on login:', restoredCartItems);
        // Always update cartItems state and localStorage with restoredCartItems on reservation load
        setCartItems(restoredCartItems);
        localStorage.setItem('cartItems', JSON.stringify(restoredCartItems));
      } else {
        // If no reservation, clear cartItems and localStorage
        setCartItems([]);
        localStorage.removeItem('cartItems');
      }
    } catch (err) {
      console.log('No reservation or failed to fetch user info');
      // On error, clear cartItems and localStorage
      setCartItems([]);
      localStorage.removeItem('cartItems');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Updated useEffect for conditional refresh every 10 seconds when showing checked-in details or reservation summary with QR code
  useEffect(() => {
    if (
      !hasReservation ||
      isEditing ||
      isSubmitting ||
      !reservation ||
      menuModalOpen
    ) {
      return;
    }

    const showCheckedInDetails = reservation.status === 'checked-in' && reservation.table && reservation.waiter;
    const showReservationSummary = reservation.status !== 'checked-in';

    if (!showCheckedInDetails && !showReservationSummary) {
      return;
    }

    const intervalId = setInterval(() => {
      if (
        hasReservation &&
        !isEditing &&
        !isSubmitting &&
        !menuModalOpen &&
        reservation.status === 'checked-in' &&
        (reservation.status !== 'active' && reservation.status !== 'cancelled' && reservation.status !== 'checked-in') && 
        reservation &&
        (reservation.status === 'checked-in' && reservation.table && reservation.waiter) ||
        (reservation.status !== 'checked-in')
      ) {
        fetchData();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [hasReservation, isEditing, isSubmitting, reservation, menuModalOpen]);

  // Clear cartItems from localStorage on logout (when token is removed)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        localStorage.removeItem('cartItems');
        setCartItems([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save cartItems to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleSubmit = async (e: React.FormEvent, menuItemsToSubmit?: CartItem[]) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    if (!date || isBefore(startOfDay(date), startOfDay(new Date()))) {
      toast.error('Please select a valid date.');
      setIsSubmitting(false);
      return;
    }

    // New validation: check if reservation datetime is in the future
    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number);
      const reservationDateTime = new Date(date);
      reservationDateTime.setHours(hours, minutes, 0, 0);
      const now = new Date();
      if (reservationDateTime <= now) {
        toast.error('The reservation must be in the future.');
        setIsSubmitting(false);
        return;
      }
    }

    if (!guests || Number(guests) < 1 || Number(guests) > 20) {
      setGuests('1');
      toast.error('Please enter a valid guest count between 1 and 20.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = isEditing
        ? `http://localhost:5000/api/reservations/${reservationId}`
        : 'http://localhost:5000/api/reservations/';
      const method = isEditing ? 'put' : 'post';

      // Use passed menuItemsToSubmit or fallback to cartItems state
      const menuItemsData = menuItemsToSubmit !== undefined ? menuItemsToSubmit : cartItems;

      const response = await axios({
        method,
        url,
        data: {
          date: format(date, 'yyyy-MM-dd'),
          time,
          guests: Number(guests),
          name,
          phone,
          email,
          specialRequests,
          menu: menuItemsData,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(isEditing ? 'Reservation updated!' : 'Reservation confirmed!', {
        description: `For ${guests} guests on ${format(date!, 'PPP')} at ${time}`,
      });

      setQrCode(response.data.reservation.qrCode);
      setReservationId(response.data.reservation._id);
      setIsEditing(false);
      setHasReservation(true);

      // Update cartItems state from response to reflect saved menu
      if (response.data?.reservation?.menu) {
        setCartItems(
          response.data.reservation.menu.map((item: { itemId: string; name: string; description?: string; price: number; image?: string; isVeg?: boolean; quantity: number }) => ({
            _id: item.itemId,
            name: item.name,
            description: item.description || '',
            price: item.price,
            image: item.image || '',
            isVeg: item.isVeg || false,
            quantity: item.quantity,
          }))
        );
      } else {
        setCartItems([]);
      }
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Error submitting reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // New handler for checkout button
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const handleCheckout = async () => {
    if (!reservationId) {
      toast.error('No reservation to checkout.');
      return;
    }
    setIsCheckingOut(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/reservations/${reservationId}/checkout`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Checked out successfully!');
      // Open feedback modal after successful checkout
      setFeedbackModalOpen(true);
      // Refresh reservation data after checkout
      await fetchData();
    } catch (error) {
      toast.error('Failed to checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleFeedbackSubmit = async (rating: number, comments: string, serviceQuality: number, foodQuality: number, ambiance: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!reservationId) {
        toast.error('No reservation found to submit feedback.');
        return;
      }
      await axios.post(
        `http://localhost:5000/api/reservations/${reservationId}/feedback`,
        { rating, comments, serviceQuality, foodQuality, ambiance },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Thank you for your feedback!');
      setFeedbackModalOpen(false);
      navigate('/');
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  // New handler to open menu modal on reserve button click
  const handleReserveClick = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields before opening pre-book dialog
    if (!date) {
      toast.error('Please select a date.');
      return;
    }
    if (!time) {
      toast.error('Please select a time.');
      return;
    }
    if (!guests || Number(guests) < 1 || Number(guests) > 20) {
      toast.error('Please enter a valid guest count between 1 and 20.');
      return;
    }

    // Validate reservation must be made at least 1 hour before
    if (!date || !time) {
      toast.error('Please select a valid date and time.');
      return;
    }
    const [hours, minutes] = time.split(':').map(Number);
    const reservationDateTime = new Date(date);
    reservationDateTime.setHours(hours, minutes, 0, 0);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    if (reservationDateTime < oneHourLater) {
      toast.error('Reservations must be made at least 1 hour before the reservation time.');
      return;
    }

    setOpenPreBookDialog(true);
  };


  // New handler for menu modal confirm
  const handleMenuConfirm = (selectedCartItems: CartItem[]) => {
    // Instead of merging blindly, replace cartItems with selectedCartItems directly
    // This assumes MenuModal returns the full updated cart with correct quantities including removals
    const filteredCartItems = selectedCartItems.filter(item => item.quantity > 0);

    setMenuModalOpen(false);

    // Calculate difference amount between old cartItems and filteredCartItems
    const oldTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newTotal = filteredCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const difference = newTotal - oldTotal;

    // Prepare reservation data with payment info for difference
    const reservationData = {
      date,
      time,
      guests: Number(guests),
      name,
      phone,
      email,
      specialRequests,
      _id: reservationId, // include reservation ID for update
      payment: {
        status: difference > 0 ? 'pending' : difference < 0 ? 'refund_pending' : 'paid',
        amount: Math.abs(difference),
        transactionId: '', // will be generated on backend
      },
    };

    navigate('/payment', { state: { reservationData, menuItems: filteredCartItems, difference } });
  };

  // Disable update button if no changes (only when editing)
  const isUpdateDisabled = isEditing ? (!hasChanges() || isSubmitting) : isSubmitting;

  // New handler for skip button in menu modal
  const handleSkip = () => {
    setMenuModalOpen(false);
    // Create a synthetic event to pass to handleSubmit
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    if (isEditing) {
      // If editing, keep the existing cartItems
      handleSubmit(syntheticEvent, cartItems);
    } else {
      // If not editing, clear cartItems
      setCartItems([]);
      handleSubmit(syntheticEvent, []);
    }
  };

  // New handler for pre-book dialog Yes button
  const handlePreBookYes = () => {
    setOpenPreBookDialog(false);
    setMenuModalOpen(true);
  };

  // New handler for pre-book dialog No button
  const handlePreBookNo = () => {
    setOpenPreBookDialog(false);
    // Create a synthetic event to pass to handleSubmit
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(syntheticEvent, []);
  };

  const handleCancelReservation = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/reservations/${reservationId}/cancel`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Reservation cancelled');
      setQrCode('');
      setReservationId('');
      setHasReservation(false);
      setIsEditing(false);
      setDate(new Date());
      setTime('');
      setGuests('');
      setSpecialRequests('');
      setOpenCancelDialog(false);
    } catch {
      toast.error('Failed to cancel reservation');
      setOpenCancelDialog(false);
    }
  };

  return (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-grow pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Reserve Your Dine</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Book your dining experience at Food Techie. We look forward to serving you.
          </p>
        </div>
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="bg-primary p-8 text-white">
              <h2 className="text-2xl font-semibold mb-6">Reservation Details</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Clock className="mr-3 h-5 w-5 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Opening Hours</h3>
                    <p className="text-white/80">24/7</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="mr-3 h-5 w-5 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Group Size</h3>
                    <p className="text-white/80">We accommodate all group sizes. For parties over 8, please call us.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CalendarDays className="mr-3 h-5 w-5 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Reservation Policy</h3>
                    <p className="text-white/80">Reservations can be made up to 30 days in advance. Please arrive on time.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <BanIcon className="mr-3 h-5 w-5 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Cancellation Policy</h3>
                    <p className="text-white/80">Cancellations can be made up to 2 hours in advance.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {hasReservation && !isEditing ? (
                <>
                  {reservation?.status === 'checked-in' && reservation.table && reservation.waiter ? (
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold mb-6">Checked-In Successfully</h2>
                      <div className="mb-4">
                        <p>{name}</p>
                        <p>{email}</p>
                        <p>{phone}</p>
                        <p>{guests} guests on {format(date!, 'PPP')} at {time}</p>
                        <br />
                        <p><strong>Table No:</strong> {reservation.table.tableNumber}</p>
                        <p><strong>Waiter:</strong> {reservation.waiter.name}</p>
                        <br />
                        <Button onClick={handleCheckout} disabled={isCheckingOut}>
                          {isCheckingOut ? 'Checking out...' : 'Checkout'}
                        </Button>
                        <br />
                        <p>Have a great Dine!!!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold mb-6">Your Reservation</h2>
                      <div className="relative inline-block mx-auto w-48 h-48 mb-4 border group flex justify-center items-center">
                        <img src={qrCode} alt="Reservation QR Code" className="w-full h-full" />
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = qrCode;
                            link.download = 'reservation-qr.png';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="absolute top-2 right-2 bg-white bg-opacity-80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Download QR Code"
                          title="Download QR Code"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex justify-center gap-4 mb-4">
                        <button
                          onClick={() => {
                            // Check if current time is within 2 hours of reservation date/time
                            if (!date || !time) {
                              toast.error('Invalid reservation date or time.');
                              return;
                            }
                            const [hours, minutes] = time.split(':').map(Number);
                            const reservationDateTime = new Date(date);
                            reservationDateTime.setHours(hours, minutes, 0, 0);
                            const now = new Date();
                            const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                            if (twoHoursLater > reservationDateTime) {
                              toast.error('Cannot edit reservation within 2 hours of the reservation time.');
                              return;
                            }
                            // Directly start editing without dialog
                            setIsEditing(true);
                            // Save current reservation data snapshot before editing
                            setOriginalReservation({
                              date,
                              time,
                              guests,
                              specialRequests,
                              cartItems,
                            });
                          }}
                          className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-dark transition text-sm"
                        >
                          Edit Reservation
                        </button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            // Check if current time is within 2 hours of reservation date/time before opening dialog
                            if (!date || !time) {
                              toast.error('Invalid reservation date or time.');
                              return;
                            }
                            const [hours, minutes] = time.split(':').map(Number);
                            const reservationDateTime = new Date(date);
                            reservationDateTime.setHours(hours, minutes, 0, 0);
                            const now = new Date();
                            const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                            if (twoHoursLater > reservationDateTime) {
                              toast.error('Cannot cancel reservation within 2 hours of the reservation time.');
                              return;
                            }
                            setOpenCancelDialog(true);
                          }}
                        >
                          Cancel Reservation
                        </Button>
                      </div>
                      <p className="mb-2">{name}</p>
                      <p className="mb-2">{email}</p>
                      <p className="mb-2">{phone}</p>
                      <p className="mb-2">{guests} guests on {format(date!, 'PPP')} at {time}</p>
                      {cartItems.length > 0 ? (
                        <div className="mt-4 text-left max-w-md mx-auto bg-gray-100 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold">Pre Menu Items</h3>
                            <button
                              onClick={() => {
                                if (!date || !time) {
                                  toast.error('Invalid reservation date or time.');
                                  return;
                                }
                                const [hours, minutes] = time.split(':').map(Number);
                                const reservationDateTime = new Date(date);
                                reservationDateTime.setHours(hours, minutes, 0, 0);
                                const now = new Date();
                                const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                                if (twoHoursLater > reservationDateTime) {
                                  toast.error('Cannot edit menu within 2 hours of the reservation time.');
                                  return;
                                }
                                if (!isEditing) {
                                  setIsEditing(true);
                                  // Save current reservation data snapshot before editing
                                  setOriginalReservation({
                                    date,
                                    time,
                                    guests,
                                    specialRequests,
                                    cartItems,
                                  });
                                }
                                setMenuModalOpen(true);
                              }}
                              aria-label="Edit Menu"
                              title="Edit Menu"
                              className="text-primary hover:text-primary-dark focus:outline-none"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                              </svg>
                            </button>
                          </div>
                          <ul>
                            {cartItems.map((item) => (
                              <li key={item._id} className="flex justify-between mb-1">
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="font-bold mt-2">
                            Total: ₹{cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => {
                              if (!date || !time) {
                                toast.error('Invalid reservation date or time.');
                                return;
                              }
                              const [hours, minutes] = time.split(':').map(Number);
                              const reservationDateTime = new Date(date);
                              reservationDateTime.setHours(hours, minutes, 0, 0);
                              const now = new Date();
                              const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                              if (twoHoursLater > reservationDateTime) {
                                toast.error('Cannot pre-book menu within 2 hours of the reservation time.');
                                return;
                              }
                              setMenuModalOpen(true);
                            }}
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
                          >
                            Pre Book Menu
                          </button>
                        </div>
                      )}
                      <div className="flex justify-center gap-4 mt-4">
                        {/* Removed duplicate Edit Reservation button here */}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-6">{isEditing ? 'Edit Reservation' : 'Book Your Reservation'}</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <Label>Date</Label>
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(day) => day < startOfDay(new Date()) || day > thirtyDaysFromNow}
                        />
                        {date && <p className="text-sm text-gray-500 mt-2">Selected: {format(date, 'PPP')}</p>}
                      </div>
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="guests">Guests</Label>
                        <Input
                          id="guests"
                          type="number"
                          value={guests || ''}
                          onWheel={(e) => e.currentTarget.blur()}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              setGuests(value);
                            }
                          }}
                          min={1}
                          max={20}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} disabled />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={email} disabled />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={phone} disabled />
                      </div>
                      <div>
                        <Label htmlFor="specialRequests">Special Requests</Label>
                        <Input
                          id="specialRequests"
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="flex justify-between gap-4">
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (isEditing) {
                              // Instead of directly opening menu modal, open the edit choice dialog
                              setOpenEditChoiceDialog(true);
                            } else {
                              handleReserveClick(e);
                            }
                          }}
                          disabled={isUpdateDisabled}
                        >
                          {isSubmitting ? 'Submitting...' : isEditing ? 'Update Reservation' : 'Reserve'}
                        </Button>
                        {isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEditClick}
                          >
                            Cancel Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
        <DialogTitle>Cancel Reservation</DialogTitle>
        <DialogContent>
          Are you sure you want to cancel your reservation? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)} color="primary">Back</Button>
          <Button onClick={handleCancelReservation} color="secondary">Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Edit Confirmation Dialog */}
      <Dialog open={openCancelEditConfirmDialog} onClose={cancelCancelEdit}>
        <DialogTitle>Discard Changes?</DialogTitle>
        <DialogContent>
          You have unsaved changes. Are you sure you want to discard them?
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelCancelEdit} color="primary">No</Button>
          <Button onClick={confirmCancelEdit} color="secondary">Yes</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Reservation Choice Dialog */}
      <Dialog open={openEditChoiceDialog} onClose={() => setOpenEditChoiceDialog(false)}>
        <DialogTitle>Edit Reservation</DialogTitle>
        <DialogContent>
          Would you like to continue with the same menu or edit the menu?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenEditChoiceDialog(false);
              // Call handleSubmit to update reservation with current cartItems
              const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
              handleSubmit(syntheticEvent, cartItems);
            }}
            color="primary"
          >
            Continue
          </Button>
          <Button
            onClick={() => {
              setOpenEditChoiceDialog(false);
              setMenuModalOpen(true);
            }}
            color="secondary"
            autoFocus
          >
            Edit Menu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pre-book menu confirmation dialog */}
      <Dialog open={openPreBookDialog} onClose={() => setOpenPreBookDialog(false)}>
        <DialogTitle>Pre-book Menu</DialogTitle>
        <DialogContent>
          Would you like to pre-book the menu with your reservation?
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePreBookNo} color="primary">
            No
          </Button>
          <Button onClick={handlePreBookYes} color="secondary" autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu Modal for selecting menu items */}
      <MenuModal
        key={reservationId + '-' + cartItems.length + '-' + JSON.stringify(cartItems.map(item => item._id + item.quantity))}
        open={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        onConfirm={handleMenuConfirm}
        onSkip={handleSkip}
        initialCartItems={cartItems}
        enableConfirmWhenEmpty={isEditing}
      />
      <FeedbackModal
        open={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
        onSkip={() => {
          setFeedbackModalOpen(false);
          navigate('/');
        }}
      />
    </main>
    <Footer />
  </div>
);
};

export default ReservePage;
