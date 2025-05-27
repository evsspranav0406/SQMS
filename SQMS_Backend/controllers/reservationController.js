import Reservation from '../models/Reservation.js';
import MenuItem from '../models/MenuItem.js';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Table from '../models/Table.js';
import Waiter from '../models/Waiter.js';
import { sendEmail } from '../utils/sendEmail.js';
import Notification from '../models/Notification.js';
import { sendNotification } from '../server.js';
import mongoose from 'mongoose';
// Removed import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { parse, formatISO, parseISO, format } from 'date-fns';
import { parseAndFormatDate } from '../utils/dateUtils.js';

const generateQRCode = async (reservation) => {
  const totalPrice = reservation.menu?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  const qrData = {
    id: reservation._id,
    name: reservation.name,
    phone: reservation.phone,
    email: reservation.email,
    guests: reservation.guests,
    date: reservation.date,
    time: reservation.time,
    menu: reservation.menu || [],
    totalPrice: totalPrice > 0 ? totalPrice : '',
    paid: totalPrice > 0 ? reservation.payment?.status === 'paid' : '',
    transactionIds: totalPrice > 0 ? reservation.payment.transactionId : '',
  };

  const qrString = JSON.stringify(qrData);
  return await QRCode.toDataURL(qrString);
};

// Create Walk-in Reservation (no auth)
export const createWalkInReservation = async (req, res) => {
  try {
    const { name, phone, email, guests, specialRequests } = req.body;

    if (!name || !phone || !email || !guests) {
      return res.status(400).json({ message: 'Name, phone, email, and guests are required for walk-in reservation.' });
    }

    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const time = format(now, 'HH:mm');

    const reservation = new Reservation({
      name,
      phone,
      email,
      guests,
      specialRequests,
      date,
      time,
      priority: false, // walk-in priority false
      status: 'active',
      payment: {
        status: 'pending',
        amount: 0,
        transactionIds: [],
      },
      menu: [],
    });

    reservation.qrCode = await generateQRCode(reservation);
    await reservation.save();

    res.status(201).json({ reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating walk-in reservation' });
  }
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
  const refundMessage = reservation.payment && reservation.payment.refund
      ? `<p>Your paid amount of ₹${reservation.payment.refund.toFixed(2)} will be refunded shortly.</p>`
      : '';
  let formattedDate = reservation.date;
  try {
    const parsedDate = parseISO(reservation.date);
    formattedDate = format(parsedDate, 'yyyy-MM-dd');
  } catch {}

  const htmlContent = `
    <h2>${subject}</h2>
    <p><strong>Name:</strong> ${reservation.name}</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${reservation.time}</p>
    <p><strong>Guests:</strong> ${reservation.guests}</p>
    <p><strong>Special Requests:</strong> ${reservation.specialRequests || 'None'}</p>
    <p><strong>Pre-Booked Menu:</strong></p>
    ${menuHtml}
    ${reservation.menu?.length ? `<p><strong>Total Price:</strong> ₹${totalPrice.toFixed(2)}</p>` : ''}
    ${totalPrice > 0 ? `<p><strong>Paid:</strong> ${reservation.payment?.status === 'paid' ? 'Yes' : 'No'}</p>` : ''}
    ${refundMessage}
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

// Create Reservation
export const createReservation = async (req, res) => {
  try {
    const { date, time, guests, specialRequests, menu, payment } = req.body;
    const userId = req.user._id;

    const formattedDate = parseAndFormatDate(date);
    if (!formattedDate) {
      return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD.' });
    }

    const reservationDateTime = parse(`${formattedDate} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    if (reservationDateTime < oneHourLater) {
      return res.status(400).json({ message: 'Reservations must be made at least 1 hour in advance.' });
    }

    if (reservationDateTime <= now) {
      return res.status(400).json({ message: 'Reservation date and time must be in the future.' });
    }

    const existing = await Reservation.findOne({ userId, status: { $in: ['active', 'pending'] } });
    if (existing) {
      return res.status(400).json({ message: 'You already have an active reservation.' });
    }

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
          quantity: menuItem?.quantity || 1,
        };
      });
    }

    const totalPrice = selectedMenu.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const status1 = selectedMenu.length > 0 ? 'paid' : 'pending';

    let transactionIdToUse = '';
    if (payment && status1 === 'paid') {
      transactionIdToUse = uuidv4();
    } else if (payment && payment.transactionId && payment.transactionId !== 'real-or-dummy-transaction-id') {
      transactionIdToUse = payment.transactionId;
    } else if (payment && payment.transactionId === 'real-or-dummy-transaction-id') {
      transactionIdToUse = uuidv4();
    } else if (selectedMenu.length > 0) {
      transactionIdToUse = uuidv4();
    } else {
      transactionIdToUse = '';
    }

    const paymentToSave = {
      status: totalPrice > 0 ? (selectedMenu.length > 0 ? 'paid' : 'pending') : '',
      amount: selectedMenu.length > 0 ? totalPrice : 0,
      transactionIds: [],
    };

    if (payment && payment.transactionId && payment.transactionId !== 'real-or-dummy-transaction-id') {
      paymentToSave.transactionIds = [payment.transactionId];
    } else if (status1 === 'paid') {
      paymentToSave.transactionIds = [transactionIdToUse];
    }

    const reservation = new Reservation({
      userId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      guests,
      date: formattedDate,
      time,
      specialRequests,
      menu: selectedMenu,
      payment: paymentToSave,
    });
    reservation.qrCode = await generateQRCode(reservation);
    await reservation.save();

    const notificationMessage = `Your reservation for ${formattedDate} at ${time} has been confirmed.`;
    const notification = new Notification({
      userId: typeof userId === 'string' ? mongoose.Types.ObjectId(userId) : userId,
      message: notificationMessage,
    });
    await notification.save();

    sendNotification(userId.toString(), notification.toObject());

    await sendReservationEmail(user, reservation, reservation.qrCode, 'Reservation Confirmation');

    let formattedReservation = reservation.toObject();
    if (formattedReservation.date) {
      try {
        const parsedDate = parseISO(formattedReservation.date);
        formattedReservation.date = format(parsedDate, 'yyyy-MM-dd');
      } catch {
        // leave as is
      }
    }

    res.status(201).json({ reservation: formattedReservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating reservation' });
  }
};

// Get user's current reservation
export const getMyReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ userId: req.user._id, status: { $in: ['active', 'pending', 'checked-in'] } })
      .populate('table')
      .populate('waiter');
    if (!reservation) return res.status(200).json({ message: 'No active reservation', reservation: null });

    let formattedReservation = reservation.toObject();
    if (formattedReservation.date) {
      try {
        const parsedDate = parseISO(formattedReservation.date);
        formattedReservation.date = format(parsedDate, 'yyyy-MM-dd');
      } catch {
        // leave as is
      }
    }

    res.json({ reservation: formattedReservation });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reservation' });
  }
};

// Update reservation
export const updateReservation = async (req, res) => {
  try {
    const { date, time, guests, specialRequests, menu, payment } = req.body;
    const { id } = req.params;
    const userId = req.user._id;

    const formattedDate = parseAndFormatDate(date);
    if (!formattedDate) {
      return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD.' });
    }

    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    const reservationDateTime = parse(`${formattedDate} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (twoHoursLater > reservationDateTime) {
      return res.status(400).json({ message: 'Reservations cannot be edited within 2 hours of the reservation time.' });
    }

    let selectedMenu = [];
    if (menu?.length) {
      const filteredMenu = menu.filter(item => item.quantity > 0);
      const menuItems = await MenuItem.find({ _id: { $in: filteredMenu.map(item => new mongoose.Types.ObjectId(item._id)) } });
      const filteredMenuMap = new Map(filteredMenu.map(m => [m._id, m]));
      /*selectedMenu = menuItems.map(item => {
        const menuItem = filteredMenuMap.get(item._id.toString());
        return { itemId: item._id, name: item.name, price: item.price, quantity: menuItem?.quantity || 1 }; 
      });*/
      selectedMenu=menu
    } 

    const oldTotal = reservation.menu?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
    const newTotal = selectedMenu.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const difference = newTotal - oldTotal;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    reservation.date = formattedDate;
    reservation.time = time;
    reservation.guests = guests;
    reservation.name = user.name;
    reservation.phone = user.phone;
    reservation.email = user.email;
    reservation.specialRequests = specialRequests;
    reservation.menu = selectedMenu;

    if (difference > 0) {
      const totalPaidSoFar = reservation.payment?.amount || 0;
      const existingTransactionIds = reservation.payment?.transactionIds || [];
      const existingrefund=reservation.payment?.refund ||0;
      reservation.payment = {
        status: 'paid',
        amount: totalPaidSoFar + difference,
        transactionIds: [...existingTransactionIds, uuidv4()],
        refund: existingrefund,
      };
    } else if (difference < 0) {
      // If menu is emptied (length 0), set payment status to refunded with same amount and transactionIds
      if (menu.length === 0) {
        const existingrefund=reservation.payment?.refund ||0;
        reservation.payment = {
          status: 'refunded',
          amount: ''||0,
          transactionIds: reservation.payment.transactionIds,
          refund: reservation.payment.amount+existingrefund,
        };
      } else {
        const existingTransactionIds = reservation.payment?.transactionIds || [];
        const existingrefund=reservation.payment?.refund ||0;
        reservation.payment = {
          status: 'paid',
          amount: reservation.payment.amount+difference,
          refund: Math.abs(difference)+existingrefund,
          transactionIds: [...existingTransactionIds],
        };
      }
    } else {
      // Keep existing payment if no difference
      if (payment) {
        reservation.payment = payment;
      }
      // else keep existing payment as is (do not overwrite)
    }

    reservation.qrCode = await generateQRCode(reservation);

    await reservation.save();

    const notificationMessage = `Your reservation is upated to ${formattedDate} at ${time}.`;
    const notification = new Notification({
      userId: typeof userId === 'string' ? mongoose.Types.ObjectId(userId) : userId,
      message: notificationMessage,
    });
    await notification.save();

    sendNotification(userId.toString(), notification.toObject());

    await sendReservationEmail(user, reservation, reservation.qrCode, 'Reservation Updated');

    let formattedReservation = reservation.toObject();
    if (formattedReservation.date) {
      try {
        const parsedDate = parseISO(formattedReservation.date);
        formattedReservation.date = format(parsedDate, 'yyyy-MM-dd');
      } catch {
        // leave as is
      }
    }

    res.json({ reservation: formattedReservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating reservation' });
  }
};

// Cancel reservation
const sendCancellationEmail = async (user, reservation) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let formattedDate = reservation.date;
  try {
    const parsedDate = parseISO(reservation.date);
    formattedDate = format(parsedDate, 'yyyy-MM-dd');
  } catch {}

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

    const reservationDateTime = parse(`${reservation.date} ${reservation.time}`, 'yyyy-MM-dd HH:mm', new Date());
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (twoHoursLater > reservationDateTime) {
      return res.status(400).json({ message: 'Reservations cannot be cancelled within 2 hours of the reservation time.' });
    }

    reservation.status = 'cancelled';

    if (reservation.status === 'cancelled' && reservation.payment.status === 'paid') {
      reservation.payment.status = 'refunded';
    }

    await reservation.save();

    // Decrement waiter currentTableCount and update status
    if (reservation.waiter) {
      const waiter = await Waiter.findById(reservation.waiter);
      if (waiter) {
        waiter.currentTableCount = Math.max((waiter.currentTableCount || 1) - 1, 0);
        if (waiter.currentReservationId && waiter.currentReservationId.toString() === reservation._id.toString()) {
          waiter.currentReservationId = null;
        }
        if (waiter.currentTableCount < 5) {
          waiter.status = 'available';
        }
        await waiter.save();
      }
    }
    const notificationMessage = `Your Reservation Has Been Cancelled.Please fell free to make another reservation if it was a mistake.`; 
    const notification = new Notification({
      userId: typeof reservation.userId === 'string' ? mongoose.Types.ObjectId(reservation.userId) : reservation.userId,
      message: notificationMessage,
    });
    await notification.save();

    sendNotification(reservation.userId.toString(), notification.toObject());
    const user = await User.findById(userId);

    const refundMessage = reservation.payment && reservation.payment.status === 'refunded'
      ? `<p>Your paid amount of ₹${reservation.payment.amount.toFixed(2)} will be refunded shortly.</p>`
      : '';

    const cancellationEmailHtml = `
      <h2>Your Reservation Has Been Cancelled</h2>
      <p><strong>Name:</strong> ${reservation.name}</p>
      <p><strong>Date:</strong> ${reservation.date}</p>
      <p><strong>Time:</strong> ${reservation.time}</p>
      <p><strong>Guests:</strong> ${reservation.guests}</p>
      ${refundMessage}
      <p>If this was a mistake, feel free to make another reservation.</p>
    `;

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
      html: cancellationEmailHtml,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Reservation cancelled', refund: refundMessage ? `Refund of ₹${reservation.payment.amount.toFixed(2)} is in process.` : 'No refund applicable.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error cancelling reservation' });
  }
};

//completed mail
const sendCheckoutEmail = async (user) => {
  const subject = 'Thank You for Dining with Us at Food Techie!';
  const htmlContent = `
    <p>Dear,${user.name},</p>
    <p>Thank you for choosing <strong>Food Techie Restaurant</strong> for your recent dining experience. We’re truly delighted to have had the opportunity to serve you.</p>
    <p>We hope you enjoyed your meal and had a wonderful time with us. At Food Techie, we are committed to delivering delicious food and memorable service, and your satisfaction is our top priority.</p>
    <p>We look forward to welcoming you again soon. If you have any feedback or suggestions, please don’t hesitate to share—we’re always eager to improve and serve you better.</p>
    <p>We hope you have a great dining experience!</p>
    <p>Warm regards,</p>
    <p>The Food Techie Team</p>

    `;
  await sendEmail(user.email, subject, htmlContent);
};
// Mark reservation as completed
export const completeReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    reservation.status = 'completed';
    await reservation.save();

    // Decrement waiter currentTableCount and update status
    if (reservation.waiter) {
      const waiter = await Waiter.findById(reservation.waiter);
      if (waiter) {
        waiter.currentTableCount = Math.max((waiter.currentTableCount || 1) - 1, 0);
        if (waiter.currentReservationId && waiter.currentReservationId.toString() === reservation._id.toString()) {
          waiter.currentReservationId = null;
        }
        if (waiter.currentTableCount < 5) {
          waiter.status = 'available';
        } else {
          waiter.status = 'occupied';
        }
        await waiter.save();
      }
    }

    if (reservation.table) {
      const table = await Table.findById(reservation.table);
      if (table) {
        table.status = 'available';
        await table.save();
      }
    }

    const notificationMessage = `Thank you for Choosing Our Restaurant.Hope you had a great dining experience.`;
    const notification = new Notification({
      userId: typeof reservation.userId === 'string' ? mongoose.Types.ObjectId(reservation.userId) : reservation.userId,
      message: notificationMessage,
    });
    await notification.save();

    sendNotification(reservation.userId.toString(), notification.toObject());

    const user = await User.findById(reservation.userId);
    if (user) {
      await sendCheckoutEmail(user);
    }
    res.json({ message: 'Reservation marked as completed', reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error marking reservation as completed' });
  }
};

export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    let formattedReservation = reservation.toObject();
    if (formattedReservation.date) {
      try {
        const parsedDate = parseISO(formattedReservation.date);
        formattedReservation.date = format(parsedDate, 'yyyy-MM-dd');
      } catch {
        // leave as is
      }
    }

    res.json({ reservation: formattedReservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching reservation' });
  }
};

export const getActiveReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (!['active', 'pending'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Reservation is not active or pending' });
    }

    let formattedReservation = reservation.toObject();
    if (formattedReservation.date) {
      try {
        const parsedDate = parseISO(formattedReservation.date);
        formattedReservation.date = format(parsedDate, 'yyyy-MM-dd');
      } catch {
        // leave as is
      }
    }

    res.json({ reservation: formattedReservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching reservation' });
  }
};

// New controller to get reservation by reservationId, phone or email
export const getReservationByQuery = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    // If query is a valid MongoDB ObjectId, try to find by ID
    if (mongoose.Types.ObjectId.isValid(query)) {
      const reservation = await Reservation.findById(query);
      if (reservation) {
        let formattedReservation = reservation.toObject();
        if (formattedReservation.date) {
          try {
            const parsedDate = parseISO(formattedReservation.date);
            formattedReservation.date = format(parsedDate, 'yyyy-MM-dd');
          } catch {
            // leave as is
          }
        }
        return res.json({ reservations: [formattedReservation] });
      }
    }

    // Find all reservations by phone or email
    const reservations = await Reservation.find({
      $or: [
        { phone: query },
        { email: query }
      ]
    });

    if (!reservations || reservations.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Format dates for all reservations
    const formattedReservations = reservations.map(reservation => {
      let formattedReservation = reservation.toObject();
      if (formattedReservation.date) {
        try {
          const parsedDate = parseISO(formattedReservation.date);
          formattedReservation.date = format(parsedDate, 'yyyy-MM-dd');
        } catch {
          // leave as is
        }
      }
      return formattedReservation;
    });

    res.json({ reservations: formattedReservations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching reservation' });
  }
};

// New controller to save feedback for a reservation
export const saveFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comments, serviceQuality, foodQuality, ambiance } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (!serviceQuality || serviceQuality < 1 || serviceQuality > 5) {
      return res.status(400).json({ message: 'Service Quality rating must be between 1 and 5' });
    }
    if (!foodQuality || foodQuality < 1 || foodQuality > 5) {
      return res.status(400).json({ message: 'Food Quality rating must be between 1 and 5' });
    }
    if (!ambiance || ambiance < 1 || ambiance > 5) {
      return res.status(400).json({ message: 'Ambiance rating must be between 1 and 5' });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    reservation.feedback = {
      rating,
      comments,
      serviceQuality,
      foodQuality,
      ambiance,
      date: new Date(),
    };

    await reservation.save();

    res.json({ message: 'Feedback saved successfully', feedback: reservation.feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving feedback' });
  }
};

const sendCheckInEmail = async (user, table, waiter) => {
  const subject = 'Reservation Checked In - Table and Waiter Assigned';

  let formattedDate = '';
  try {
    if (user.reservation && user.reservation.date) {
      const parsedDate = parseISO(user.reservation.date);
      formattedDate = format(parsedDate, 'yyyy-MM-dd');
    }
  } catch {}

  const htmlContent = `
    <h2>Your Reservation is Checked In</h2>
    <p>Dear,${user.name} thanks for choosing our restaurant</p>
    <p>You have been allocated with table number is: <strong>${table.tableNumber}</strong></p>
    <p>Your assigned waiter is: <strong>${waiter.name}</strong></p>
    <p>We hope you have a great dining experience!</p>
  `;
  await sendEmail(user.email, subject, htmlContent);
};

export const checkInReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const qrData = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status === 'checked-in') {
      return res.status(400).json({ message: 'Reservation is already checked in' });
    }
    if (reservation.status === 'completed') {
      return res.status(400).json({ message: 'Reservation is already completed' });
    }
    if (!['active', 'pending'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Reservation cannot be checked in' });
    }

    // Validate QR fields: guests, menu, time, date
    if (qrData.guests !== reservation.guests) {
      return res.status(400).json({ message: 'Guest count does not match reservation' });
    }

    if (qrData.date !== reservation.date) {
      return res.status(400).json({ message: 'Reservation date does not match' });
    }

    if (qrData.time !== reservation.time) {
      return res.status(400).json({ message: 'Reservation time does not match' });
    }

    // Validate menu items: check if menu arrays match in length and items
    if (Array.isArray(qrData.menu) && Array.isArray(reservation.menu)) {
      if (qrData.menu.length !== reservation.menu.length) {
        return res.status(400).json({ message: 'Menu items count does not match reservation' });
      }
      for (let i = 0; i < qrData.menu.length; i++) {
        const qrItem = qrData.menu[i];
        const resItem = reservation.menu[i];
        if (qrItem.name !== resItem.name || qrItem.quantity !== resItem.quantity) {
          return res.status(400).json({ message: 'Menu items do not match reservation' });
        }
      }
    } else if (qrData.menu || reservation.menu) {
      // One is array and other is not
      return res.status(400).json({ message: 'Menu data invalid or does not match' });
    }

    // Find suitable available table
    const suitableTable = await Table.findOne({
      capacity: { $gte: reservation.guests },
      status: 'available',
    }).sort({ capacity: 1 });

    if (!suitableTable) {
      return res.status(400).json({ message: 'No suitable table available' });
    }

    // Find available waiter with less than 5 tables assigned
    const availableWaiter = await Waiter.findOne({ currentTableCount: { $lt: 5 } }).sort({ currentTableCount: 1 });
    if (!availableWaiter) {
      return res.status(400).json({ message: 'No available waiter' });
    }

    // Update reservation status
    reservation.status = 'checked-in';
    reservation.table = suitableTable._id;
    reservation.waiter = availableWaiter._id;
    await reservation.save();

    // Update table status
    suitableTable.status = 'occupied';
    suitableTable.currentReservationId = reservation._id;
    await suitableTable.save();

    // Update waiter currentTableCount and status
    availableWaiter.currentTableCount = (availableWaiter.currentTableCount || 0) + 1;
    availableWaiter.currentReservationId = reservation._id;
    if (availableWaiter.currentTableCount >= 5) {
      availableWaiter.status = 'occupied';
    } else {
      availableWaiter.status = 'available';
    }
    await availableWaiter.save();

    const notificationMessage = `Your reservation for ${reservation.date} at ${reservation.time} has been checked in.Your table number is ${suitableTable.tableNumber} and your waiter is ${availableWaiter.name}.`;
    const notification = new Notification({
      userId: typeof reservation.userId === 'string' ? mongoose.Types.ObjectId(reservation.userId) : reservation.userId,
      message: notificationMessage,
    });
    await notification.save();

    sendNotification(reservation.userId.toString(), notification.toObject());

    // Populate table and waiter before sending response
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('table')
      .populate('waiter');
    // Get user for email
    const user = await User.findById(reservation.userId);
    if (user) {
      await sendCheckInEmail(user, populatedReservation.table, populatedReservation.waiter);
    }

    res.json({ reservation: populatedReservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error during check-in' });
  }
};
