import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const WalkInReservation = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!name || !email || !phone || !guests) {
      toast.error('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/reservations/walkin', {
        name,
        email,
        phone,
        guests: Number(guests),
        specialRequests,
      });

      setQrCode(response.data.reservation.qrCode);
      toast.success('Walk-in reservation created successfully!');
    } catch (error) {
      toast.error('Failed to create walk-in reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">Walk-In Reservation</h1>
          {!qrCode ? (
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
              <div>
                <label htmlFor="name" className="block font-semibold mb-1">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="email" className="block font-semibold mb-1">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block font-semibold mb-1">Phone *</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="guests" className="block font-semibold mb-1">Number of Guests *</label>
                <input
                  id="guests"
                  type="number"
                  min="1"
                  max="20"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="specialRequests" className="block font-semibold mb-1">Special Requests</label>
                <textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark transition"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Create Walk-In Reservation'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Your Walk-In Reservation QR Code</h2>
              <img src={qrCode} alt="Walk-In Reservation QR Code" className="mx-auto mb-4" />
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrCode;
                  link.download = 'walkin-reservation-qr.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition"
              >
                Download QR Code
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WalkInReservation;
