import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Expect reservation details and menu items passed via location state
  const { reservationData, menuItems, difference } = location.state || {};

  const [isProcessing, setIsProcessing] = useState(false);

  if (!reservationData) {
    return <div>No reservation data found. Please start your reservation again.</div>;
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to make a reservation.');
        navigate('/login');
        return;
      }

      const amountToPay = difference !== undefined ? Math.abs(difference) : menuItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const paymentInfo = {
        status: difference !== undefined ? (difference > 0 ? 'paid' : 'refunded') : 'paid',
        amount: amountToPay,
        refund: difference !== undefined && difference < 0 ? amountToPay : 0,
        transactionIds: uuidv4(),
      };

      let response;
      if (reservationData._id) {
        // Update existing reservation
        response = await axios.put(`http://localhost:5000/api/reservations/${reservationData._id}`, {
          ...reservationData,
          menu: menuItems,
          payment: paymentInfo,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Create new reservation
        response = await axios.post('http://localhost:5000/api/reservations/', {
          ...reservationData,
          menu: menuItems,
          payment: paymentInfo,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      navigate('/reserve', { state: { reservation: response.data.reservation, paid: true } });
    } catch (error) {
      toast.error('Payment failed or reservation could not be created.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefundConfirm = async () => {
    await handlePayment();
  };

  const amountToPay = difference !== undefined ? Math.abs(difference) : menuItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (difference !== undefined && difference < 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-6">Refund</h1>
        <p className="mb-4">Your reservation total has decreased.</p>
        <p className="mb-4">Amount to be refunded: ₹{amountToPay.toFixed(2)}</p>
        <p className="mb-4">Please confirm to process the refund. Thank you for your patience.</p>
        <button
          onClick={handleRefundConfirm}
          disabled={isProcessing}
          className="px-6 py-3 bg-primary text-white rounded hover:bg-primary-dark transition"
        >
          {isProcessing ? 'Processing Refund...' : 'Confirm Refund'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Payment</h1>
      <p className="mb-4">Please confirm your payment to complete the reservation.</p>
      <p className="mb-2">Amount to pay: ₹{amountToPay.toFixed(2)}</p>
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="px-6 py-3 bg-primary text-white rounded hover:bg-primary-dark transition"
      >
        {isProcessing ? 'Processing Payment...' : 'Pay Now'}
      </button>
    </div>
  );
};

export default PaymentPage;
