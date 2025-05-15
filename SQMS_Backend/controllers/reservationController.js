import Reservation from '../models/Reservation.js';
import MenuItem from '../models/MenuItem.js';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';
import Notification from '../models/Notification.js';
import { sendNotification } from '../server.js';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const generateQRCode = async (reservation) => {
  const qrData = {
    id: reservation._id,
    name: reservation.name,
    phone: reservation.phone,
    email: reservation.email,
    guests: reservation.guests,
    date: reservation.date,
    time: reservation.time,
    menu: reservation.menu || [],
  };

  const qrString = JSON.stringify(qrData);
  return await QRCode.toDataURL(qrString);
};

const sendReservationEmail = async (user, reservation, qrCode, subject = 'Reservation Confirmation') => {
  const menuHtml = reservation.menu?.length
    ? `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${reservation.menu.map(item => `
            <tr>
              <td>${item.name}</td>
              <td style="text-align:center;">${item.quantity}</td>
              <td style="text-align:right;">₹${item.price.toFixed(2)}</td>
              <td style="text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`
    : 'None';

  const totalPrice = reservation.menu?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

  const htmlContent = `
    <h2>Reservation Confirmed</h2>
    <p><strong>Name:</strong> ${reservation.name}</p>
    <p><strong>Date:</strong> ${reservation.date}</p>
    <p><strong>Time:</strong> ${reservation.time}</p>
    <p><strong>Guests:</strong> ${reservation.guests}</p>
    <p><strong>Special Requests:</strong> ${reservation.specialRequests || 'None'}</p>
    <p><strong>Pre-Booked Menu:</strong></p>
    ${menuHtml}
    ${reservation.menu?.length ? `<p><strong>Total Price:</strong> ₹${totalPrice.toFixed(2)}</p>` : ''}
  `;

  const attachments = [
    {
      filename: 'reservation-qr.png',
      content: qrCode.split("base64,")[1],
      encoding: 'base64',
    },
  ];

  await sendEmail(user.email, subject, htmlContent, attachments);
};

import { parse, formatISO } from 'date-fns';

// Create  Reservation
export const createReservation = async (req, res) => {
  try {
    const { date, time, guests, specialRequests, menu, payment } = req.body;
    const userId = req.user._id;

    // Parse date and time as local time explicitly
    const reservationDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    const now = new Date();

    // Reject reservation if less than 1 hour from now
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    console.log('Reservation DateTime:', reservationDateTime);
    console.log('One Hour Later:', oneHourLater);

    if (reservationDateTime < oneHourLater) {
      return res.status(400).json({ message: 'Reservations must be made at least 1 hour in advance.' });
    }

    if (reservationDateTime <= now) {
      return res.status(400).json({ message: 'Reservation date and time must be in the future.' });
    }

    // Check for existing reservation
    const existing = await Reservation.findOne({ userId, status: { $in: ['active', 'pending'] } });
    if (existing) {
      return res.status(400).json({ message: 'You already have an active reservation.' });
    }

    // Get user details from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let selectedMenu = [];
    if (menu?.length) {
      const menuItems = await MenuItem.find({ _id: { $in: menu.map(item => item._id) } });
      selectedMenu = menuItems.map(item => {
        const menuItem = menu.find(m => m._id.toString() === item._id.toString());
        return { 
          itemId: item._id, 
          name: item.name, 
          price: item.price, 
          quantity: menuItem?.quantity || 1 
        };
      });
    }

    const reservation = new Reservation({
      userId,
      name: user.name,    // From user document
      phone: user.phone,  // From user document
      email: user.email,  // From user document
      guests,
      date,
      time,
      specialRequests,
      menu: selectedMenu,
      payment: payment || {
        status: 'pending',
        amount: 0,
        transactionId: uuidv4()
      }
    });

    reservation.qrCode = await generateQRCode(reservation);
    await reservation.save();

    // Create notification for reservation
    const notificationMessage = `Your reservation for ${date} at ${time} has been confirmed.`;
    const notification = new Notification({
      userId: userId.toString(),
      message: notificationMessage,
    });
    await notification.save();

    // Emit notification via socket.io
    sendNotification(userId.toString(), notification.toObject());

    await sendReservationEmail(user, reservation, reservation.qrCode, 'Reservation Confirmation');

    let formattedReservation = reservation.toObject();
    if (formattedReservation.date) {
      try {
        const parsedDate = parseISO(formattedReservation.date);
        formattedReservation.date = format(parsedDate, 'yyyy-MM-dd');
      } catch {
        // If parsing fails, leave date as is
      }
    }

    res.status(201).json({ reservation: formattedReservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating reservation' });
  }
};

// Get user's current reservation
import { format, parseISO } from 'date-fns';

export const getMyReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ userId: req.user._id, status: { $in: ['active', 'pending'] } });
    if (!reservation) return res.status(200).json({ message: 'No active reservation', reservation: null });

    // Format date to YYYY-MM-DD if date is ISO string
    let formattedReservation = reservation.toObject();
    if (formattedReservation.date) {
      try {
        const parsedDate = parseISO(formattedReservation.date);
        formattedReservation.date = format(parsedDate, 'yyyy-MM-dd');
      } catch {
        // If parsing fails, leave date as is
      }
    }

    res.json({ reservation: formattedReservation });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reservation' });
  }
};

import { v4 as uuidv4 } from 'uuid';

// Update reservation
export const updateReservation = async (req, res) => {
  try {
    const { date, time, guests, name, phone, email, specialRequests, menu, payment } = req.body;
    const { id } = req.params;
    const userId = req.user._id;

    console.log('updateReservation called with menu:', menu);

    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // Disallow editing if within 2 hours of reservation time
    // Combine date and time properly to avoid invalid ISO string
    const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (twoHoursLater > reservationDateTime) {
      return res.status(400).json({ message: 'Reservations cannot be edited within 2 hours of the reservation time.' });
    }

    let selectedMenu = [];
    if (menu?.length) {
      console.log('Filtering menu items with quantity > 0');
      // Filter out items with quantity <= 0 before processing
      const filteredMenu = menu.filter(item => item.quantity > 0);
      console.log('Filtered menu:', filteredMenu);
      const menuItems = await MenuItem.find({ _id: { $in: filteredMenu.map(item => new ObjectId(item._id)) } });
      const filteredMenuMap = new Map(filteredMenu.map(m => [m._id, m]));
      selectedMenu = menuItems.map(item => {
        const menuItem = filteredMenuMap.get(item._id.toString());
        console.log('Mapping menu item:', item._id.toString(), 'Found in filteredMenu:', menuItem);
        return { itemId: item._id, name: item.name, price: item.price, quantity: menuItem?.quantity || 1 };
      });
      console.log('Selected menu after mapping:', selectedMenu);
    }

    // Calculate old and new total amounts
    const oldTotal = reservation.menu?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
    const newTotal = selectedMenu.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Calculate difference
    const difference = newTotal - oldTotal;
 const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Update reservation fields
    reservation.date = date;
    reservation.time = time;
    reservation.guests = guests;
    reservation.name = user.name;
    reservation.phone = user.phone;
    reservation.email = user.email;
    reservation.specialRequests = specialRequests;
    reservation.menu = selectedMenu;

    // Handle payment update based on difference
    if (difference > 0) {
      // Additional payment required
      reservation.payment = {
        status: 'pending',
        amount: difference,
        transactionId: uuidv4(),
      };
    } else if (difference < 0) {
      // Refund required
      reservation.payment = {
        status: 'refund_pending',
        amount: Math.abs(difference),
        transactionId: uuidv4(),
      };
    } else {
      // No change in payment
      reservation.payment = payment || {
        status: 'pending',
        amount: 0,
        transactionId: '',
      };
    }

    reservation.qrCode = await generateQRCode(reservation);

    await reservation.save();

    await sendReservationEmail(user, reservation, reservation.qrCode, 'Reservation Updated');

    let formattedReservation = reservation.toObject();
    if (formattedReservation.date) {
      try {
        const parsedDate = parseISO(formattedReservation.date);
        formattedReservation.date = format(parsedDate, 'yyyy-MM-dd');
      } catch {
        // If parsing fails, leave date as is
      }
    }

    res.json({ reservation: formattedReservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating reservation' });
  }
};

// Cancel reservation
// Send cancellation email
const sendCancellationEmail = async (user, reservation) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Reservation Cancelled - Food Techie',
    html: `
      <h2>Your Reservation Has Been Cancelled</h2>
      <p><strong>Name:</strong> ${reservation.name}</p>
      <p><strong>Date:</strong> ${reservation.date}</p>
      <p><strong>Time:</strong> ${reservation.time}</p>
      <p><strong>Guests:</strong> ${reservation.guests}</p>
      <p>If this was a mistake, feel free to make another reservation.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // Disallow canceling if within 2 hours of reservation time
    // Combine date and time properly to avoid invalid ISO string
    const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (twoHoursLater > reservationDateTime) {
      return res.status(400).json({ message: 'Reservations cannot be cancelled within 2 hours of the reservation time.' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    const user = await User.findById(userId);
    await sendCancellationEmail(user, reservation);

    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error cancelling reservation' });
  }
};

// Mark reservation as completed
export const completeReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    // Combine date and time properly to avoid invalid ISO string
    const reservationDateTime = new Date(`${reservation.date}T${reservation.time}:00`);

    reservation.status = 'completed';
    await reservation.save();

    res.json({ message: 'Reservation marked as completed', reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error marking reservation as completed' });
  }
};

// Cancel reservations that are more than 30 minutes past their reservation time
export const autoCancelExpiredReservations = async (req, res) => {
  try {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

    // Find reservations with status active or pending and reservation datetime before cutoffTime
    const expiredReservations = await Reservation.find({
      status: { $in: ['active', 'pending'] },
      $expr: {
        $lt: [
          { $dateFromString: { dateString: { $concat: ['$date', 'T', '$time', ':00'] } } },
          cutoffTime,
        ],
      },
    });

    for (const reservation of expiredReservations) {
      reservation.status = 'cancelled';
      await reservation.save();

      // Send cancellation email
      const user = await User.findById(reservation.userId);
      if (user) {
        await sendCancellationEmail(user, reservation);
      }
    }

    res.json({ message: `Cancelled ${expiredReservations.length} expired reservations.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error auto-cancelling expired reservations' });
  }
};
