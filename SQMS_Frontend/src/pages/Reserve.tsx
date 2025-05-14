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
import { jwtDecode } from 'jwt-decode';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuModal from '@/components/MenuModal';

interface DecodedToken {
  id: string;
}

const ReservePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [originalReservation, setOriginalReservation] = useState<{
    date: Date | undefined;
    time: string;
    guests: string;
    specialRequests: string;
  } | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openCancelEditConfirmDialog, setOpenCancelEditConfirmDialog] = useState(false);

  // New states for menu booking workflow
  const [openMenuBookingDialog, setOpenMenuBookingDialog] = useState(false);
  const [openMenuModal, setOpenMenuModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState([]);
  const [menuEditDialogOpen, setMenuEditDialogOpen] = useState(false);
  const [menuEditInitial, setMenuEditInitial] = useState([]);
  const [menuEditContinue, setMenuEditContinue] = useState(false);

  const hasChanges = () => {
    if (!originalReservation) return false;
    if (!date || !originalReservation.date) return true;
    if (date.getTime() !== originalReservation.date.getTime()) return true;
    if (time !== originalReservation.time) return true;
    if (guests !== originalReservation.guests) return true;
    if (specialRequests !== originalReservation.specialRequests) return true;
    return false;
  };

  const handleCancelEditClick = () => {
    if (hasChanges()) {
      setOpenCancelEditConfirmDialog(true);
    } else {
      setIsEditing(false);
    }
  };

  const confirmCancelEdit = () => {
    if (originalReservation) {
      setDate(originalReservation.date);
      setTime(originalReservation.time);
      setGuests(originalReservation.guests);
      setSpecialRequests(originalReservation.specialRequests);
    }
    setIsEditing(false);
    setOpenCancelEditConfirmDialog(false);
  };

  const cancelCancelEdit = () => {
    setOpenCancelEditConfirmDialog(false);
  };

  // Added missing handleCancelReservation function
  const handleCancelReservation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to cancel a reservation.');
        return;
      }
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
    } catch (error) {
      toast.error('Failed to cancel reservation');
      setOpenCancelDialog(false);
    }
  };

  const thirtyDaysFromNow = addDays(new Date(), 30);

  useEffect(() => {
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
          setOriginalReservation({
            date: parseISO(r.date),
            time: r.time,
            guests: r.guests ? String(r.guests) : '1',
            specialRequests: r.specialRequests || '',
          });
          setSelectedMenu(r.menu || []);
        } else {
          setHasReservation(false);
          setOriginalReservation(null);
          setSelectedMenu([]);
        }
      } catch (err) {
        console.log('No reservation or failed to fetch user info');
        setHasReservation(false);
        setOriginalReservation(null);
        setSelectedMenu([]);
      }
    };

    fetchData();
  }, []);

  // Periodically refresh reservation data every 1 minute to reflect cancellations
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshToggle(prev => !prev);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Refetch reservation data when refreshToggle changes
  useEffect(() => {
    const fetchReservation = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
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
          setOriginalReservation({
            date: parseISO(r.date),
            time: r.time,
            guests: r.guests ? String(r.guests) : '1',
            specialRequests: r.specialRequests || '',
          });
          setSelectedMenu(r.menu || []);
        } else {
          setHasReservation(false);
          setOriginalReservation(null);
          setSelectedMenu([]);
        }
      } catch (err) {
        console.log('Failed to fetch reservation during refresh');
      }
    };

    fetchReservation();
  }, [refreshToggle]);

  // Modified handleSubmit to only validate and show menu booking dialog, defer reservation creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || isBefore(startOfDay(date), startOfDay(new Date()))) {
      toast.error('Please select a valid date.');
      return;
    }

    if (date && time) {
      const [hours, minutes] = time.split(':').map(Number);
      const reservationDateTime = new Date(date);
      reservationDateTime.setHours(hours, minutes, 0, 0);
      const now = new Date();
      if (reservationDateTime <= now) {
        toast.error('The reservation must be in the future.');
        return;
      }
    }

    if (!guests || Number(guests) < 1 || Number(guests) > 20) {
      setGuests('1');
      toast.error('Please enter a valid guest count between 1 and 20.');
      return;
    }

    // Show menu booking dialog after validation
    if (isEditing) {
      // For editing, show dialog to continue with same menu or edit menu
      setMenuEditInitial(selectedMenu);
      setMenuEditDialogOpen(true);
    } else {
      setOpenMenuBookingDialog(true);
    }
  };

  // New function to create reservation after menu booking decision and payment
  const createReservationAfterMenu = async (menuItems = [], paymentInfo = { status: 'pending', amount: 0, transactionId: '' }) => {
    console.log('createReservationAfterMenu called with menuItems:', menuItems);
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditing
        ? `http://localhost:5000/api/reservations/${reservationId}`
        : 'http://localhost:5000/api/reservations/';
      const method = isEditing ? 'put' : 'post';

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
          menu: menuItems,
          payment: paymentInfo,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReservationId(response.data.reservation._id);
      setQrCode(response.data.reservation.qrCode);
      setHasReservation(true);

      // After reservation creation, if editing and continuing with same menu, show success toast
      if (isEditing && menuEditContinue) {
        toast.success('Reservation updated with existing menu.');
      } else if (isEditing && !menuEditContinue) {
        // Navigate to reservation summary page after update with new menu
        navigate('/reserve', { state: { reservationId: response.data.reservation._id, paid: true } });
      }
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Error submitting reservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for menu booking dialog after new reservation
  const handleMenuBookingYes = () => {
    setOpenMenuBookingDialog(false);
    setOpenMenuModal(true);
  };

  const handleMenuBookingNo = async () => {
    setOpenMenuBookingDialog(false);
    // Create reservation without menu and payment info
    await createReservationAfterMenu([], { status: 'paid', amount: 0, transactionId: 'no-menu' });
    // Redirect to reservation summary page (current page) with paid status
    navigate('/reserve', { state: { reservationId, paid: true } });
  };

  // Handlers for menu edit dialog after reservation update
  const handleMenuEditContinue = async () => {
    setMenuEditContinue(true);
    setMenuEditDialogOpen(false);
    console.log('handleMenuEditContinue called with menuEditInitial:', menuEditInitial);
    console.log('Current selectedMenu:', selectedMenu);
    // Update reservation with same menu and send same invoice
    try {
      await createReservationAfterMenu(menuEditInitial, { status: 'paid', amount: 0, transactionId: 'continue-same-menu' });
      setSelectedMenu(menuEditInitial); // Ensure state is updated
      console.log('SelectedMenu after update:', menuEditInitial);
      toast.success('Reservation updated with existing menu.');
      // Navigate to reservation summary page with paid status and showSummary flag
      navigate('/reserve', { state: { reservationId, paid: true, showSummary: true }, replace: true });
    } catch (error) {
      toast.error('Failed to update reservation with existing menu.');
    }
  };

  const handleMenuEditEdit = () => {
    setMenuEditContinue(false);
    setMenuEditDialogOpen(false);
    setOpenMenuModal(true);
  };

  // Handler for confirming menu selection in MenuModal
  const handleMenuConfirm = (cartItems) => {
    console.log('handleMenuConfirm called with cartItems:', cartItems);
    setSelectedMenu(cartItems);
    setMenuEditInitial(cartItems); // Update menuEditInitial with latest cart items
    setOpenMenuModal(false);
    // Redirect to payment page with reservation data and selected menu
    navigate('/payment', {
      state: {
        reservationData: {
          _id: reservationId,
          date: format(date, 'yyyy-MM-dd'),
          time,
          guests: Number(guests),
          name,
          phone,
          email,
          specialRequests,
        },
        menuItems: cartItems,
        difference: isEditing ? calculateDifference(selectedMenu, cartItems) : undefined,
      },
    });
  };

  // Handler for skipping menu booking
  const handleMenuSkip = () => {
    setOpenMenuModal(false);
    // Redirect to reservation summary page with paid status
    navigate('/reserve', { state: { reservationId, paid: true } });
  };

  // Calculate payment difference between old and new menu
  const calculateDifference = (oldMenu, newMenu) => {
    const oldTotal = oldMenu.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newTotal = newMenu.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return newTotal - oldTotal;
  };

  // Render reservation summary if paid state is true in location state
  useEffect(() => {
    if (location.state?.paid) {
      toast.success('Payment completed. Reservation confirmed!');
    }
  }, [location.state]);

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
                      <p className="text-white/80">We accommodate all group sizes. For parties over 20, please call us.</p>
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
                      <p className="text-white/80">Cancellations can be made upto 2 hours in advance.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {hasReservation && !isEditing ? (
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-6">Your Reservation</h2>
                    <div className="relative inline-block mx-auto w-48 h-48 mb-4 border group flex justify-center items-center">
                      <img
                        src={qrCode}
                        alt="Reservation QR Code"
                        className="w-full h-full"
                      />
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
                          setIsEditing(true);
                        }}
                        onClickCapture={() => {
                          setOriginalReservation({
                            date,
                            time,
                            guests,
                            specialRequests,
                          });
                        }}
                        className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-dark transition text-sm"
                      >
                        Edit Reservation
                      </button>
                      <Button
                        variant="destructive"
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
                    <p className="mb-2">{guests} guests on {format(date!, 'yyyy-MM-dd')} at {time}</p>
                    {selectedMenu.length > 0 && (
                      <div className="mt-4 text-left">
                        <h3 className="font-semibold mb-2">Menu Selected</h3>
                        <ul>
                          {selectedMenu.map((item) => (
                            <li key={item._id}>
                              {item.name} x {item.quantity} - ₹{(item.price * item.quantity).toFixed(2)}
                            </li>
                          ))}
                        </ul>
                        <p className="font-bold mt-2">
                          Total: ₹{selectedMenu.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
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
                            type="submit"
                            disabled={isSubmitting}
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

        {/* Dialog for menu booking after new reservation */}
        <Dialog open={openMenuBookingDialog} onClose={() => setOpenMenuBookingDialog(false)}>
          <DialogTitle>Book Menu</DialogTitle>
          <DialogContent>
            Would you like to book a menu for your reservation?
          </DialogContent>
          <DialogActions>
                          <Button onClick={handleMenuBookingNo} variant="outline">No</Button>
                          <Button onClick={handleMenuBookingYes} variant="default">Yes</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog for menu edit choice after reservation update */}
        <Dialog open={menuEditDialogOpen} onClose={() => setMenuEditDialogOpen(false)}>
          <DialogTitle>Menu Options</DialogTitle>
          <DialogContent>
            Would you like to continue with the same menu or edit your menu selection?
          </DialogContent>
          <DialogActions>
                          <Button onClick={() => { console.log('Continue button clicked'); handleMenuEditContinue(); }} variant="outline">Continue</Button>
                          <Button onClick={handleMenuEditEdit} variant="default">Edit</Button>
          </DialogActions>
        </Dialog>

        {/* Menu modal for selecting or editing menu */}
        <MenuModal
          open={openMenuModal}
          onClose={() => setOpenMenuModal(false)}
          onConfirm={handleMenuConfirm}
          onSkip={handleMenuSkip}
          initialCartItems={selectedMenu.length > 0 ? selectedMenu : undefined}
          enableConfirmWhenEmpty={false}
        />

        <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
          <DialogTitle>Cancel Reservation</DialogTitle>
          <DialogContent>
            Are you sure you want to cancel your reservation? This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCancelDialog(false)} color="default">Back</Button>
            <Button onClick={handleCancelReservation} color="destructive">Confirm</Button>
          </DialogActions>
        </Dialog>

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
      </main>
      <Footer />
    </div>
  );
};

export default ReservePage;
