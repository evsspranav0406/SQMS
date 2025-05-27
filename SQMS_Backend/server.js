import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js'; // adjust path if needed
import reservationRoutes from './routes/reservationRoutes.js'; // fixed
import adminAuthRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import cron from 'node-cron';
import Reservation from './models/Reservation.js';
import User from './models/User.js';
import nodemailer from 'nodemailer';
import tableRoutes from './routes/tableRoutes.js';
import waiterRoutes from './routes/waiterRoutes.js';

import { parse, isBefore, formatISO } from 'date-fns';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://192.168.29.166:3000",
      "http://205.254.168.173:3000",
      "http://172.20.10.3:3000",
      "http://192.168.1.12:3000"
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
    origin: [
      "http://localhost:3000",
      "http://192.168.29.166:3000",
      "http://205.254.168.173:3000",
      "http://172.20.10.3:3000",
      "http://192.168.1.12:3000",
      "http://49.43.226.129:3000"
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/waiters', waiterRoutes);

// Socket.io connection
io.on('connection', (socket) => {

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
  });
});

// Function to emit notification to a user
export const sendNotification = (userId, notification) => {
  io.to(userId).emit('notification', notification);
};

// Updated auto-cancellation function
const autoCancelExpiredReservationsInternal = async () => {
  const now = new Date();
  // Create cutoffTime as local time 30 minutes before now
  const cutoffTime = new Date(now.getTime() - 30 * 60 * 1000);
  cutoffTime.setMilliseconds(0);
  cutoffTime.setSeconds(0);
  // The following setMinutes and setHours are redundant since cutoffTime is already set based on now,
  // but are kept for clarity:
  cutoffTime.setMinutes(cutoffTime.getMinutes());
  cutoffTime.setHours(cutoffTime.getHours());

  // Find all active or pending reservations
  const activeReservations = await Reservation.find({
    status: { $in: ['active', 'pending'] },
  });

  const expiredReservations = [];

  for (const reservation of activeReservations) {
    let reservationDateTime;
    try {

      // If reservation.date includes a 'T', it likely includes time (ISO format)
      // Extract only the date portion (YYYY-MM-DD) and combine with the provided time.
      const dateOnly = reservation.date.includes('T')
        ? formatISO(new Date(reservation.date), { representation: 'date' })
        : reservation.date;
      // Combine the date-only string with the time string and parse
      reservationDateTime = parse(`${dateOnly} ${reservation.time}`, 'yyyy-MM-dd HH:mm', new Date());

      if (isNaN(reservationDateTime)) {
        console.error(`Invalid date/time format for reservation ID: ${reservation._id}, skipping.`);
        continue; // Skip this reservation if parsing fails.
      }
    } catch (error) {
      console.error(`Error parsing date/time for reservation ID: ${reservation._id}`, error);
      continue; // Skip this reservation if there's an error.
    }

    // Check if the reservationDateTime is before the cutoffTime
    if (isBefore(reservationDateTime, cutoffTime)) {
      expiredReservations.push(reservation);
    } else {
    }
  }

  // Process expired reservations: update status and send cancellation email.
  for (const reservation of expiredReservations) {
    reservation.status = 'cancelled';
     if (reservation.status === 'cancelled' && reservation.payment.status === 'paid') {
      reservation.payment.status = 'refunded';
    }
    await reservation.save();

    // Send cancellation email
    const user = await User.findById(reservation.userId);
    if (user) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      const refundMessage = reservation.payment && reservation.payment.status === 'refunded'
      ? `<p>Your paid amount of ₹${reservation.payment.amount.toFixed(2)} will be refunded shortly.</p>`
      : '';
      const cancellationEmailHtml = `
      <h2>Your Reservation Has Been Cancelled</h2>
      <p>Dear,${reservation.name},we noticed you did not turn up at the check-in time</p>
      <p><strong>Name:</strong> ${reservation.name}</p>
      <p><strong>Date:</strong> ${reservation.date}</p>
      <p><strong>Time:</strong> ${reservation.time}</p>
      <p><strong>Guests:</strong> ${reservation.guests}</p>
      ${refundMessage}
      <p>Feel free to make another reservation.</p>
    `;

      const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Reservation Cancelled - Food Techie',
      html: cancellationEmailHtml,
    };

      await transporter.sendMail(mailOptions);
    }
  }
};

import { addMinutes } from 'date-fns';
import { toISTDateString } from './utils/dateUtils.js';

// Schedule the auto-cancellation job to run every minute.
cron.schedule('*/1 * * * *', async () => {
  try {
    await autoCancelExpiredReservationsInternal();
  } catch (err) {
    console.error('Error in scheduled job:', err);
  }
});

// New scheduled job to send notification 30 minutes prior to reservation
const sendNotification30MinPrior = async () => {
  const now = new Date();
  const targetTime = addMinutes(now, 30);
  const targetTimeStr = toISTDateString(targetTime);
  const targetTimeISODate = formatISO(targetTime, { representation: 'date' });
  // Find reservations with status active or pending, notification not sent, and reservation time 30 min from now
  const reservationsToNotify = await Reservation.find({
    status: { $in: ['active', 'pending'] },
    notification30MinSent: false,
    date: targetTimeISODate,
  });

  for (const reservation of reservationsToNotify) {
        let reservationDateTime;

    try {
      // Parse reservation date and time to Date object
      const dateOnly = reservation.date.includes('T')
        ? formatISO(new Date(reservation.date), { representation: 'date' })
        : reservation.date;
      // Combine the date-only string with the time string and parse
      reservationDateTime = parse(`${dateOnly} ${reservation.time}`, 'yyyy-MM-dd HH:mm', new Date());
      const targetTime = addMinutes(now, 30);
      // const targetTimeStr = toISTDateString(targetTime);
      // const targetTimeStr1 = targetTimeStr.getTime();
      // Check if reservationDateTime is within 1 minute of targetTime (to handle cron run delay)
      if (Math.abs(reservationDateTime.getTime() - targetTime.getTime()) <= 60000) {
        // Send notification to user
        const user = await User.findById(reservation.userId);
        if (user) {
          const notificationMessage = `Reminder: Your reservation is scheduled at ${reservation.time} today. Please be ready.`;
          const notification = {
            userId: reservation.userId,
            message: notificationMessage,
          };
          // Use existing sendNotification function to emit notification
          sendNotification(reservation.userId.toString(), notification);

          // Save notification to DB
          const NotificationModel = (await import('./models/Notification.js')).default;
          const newNotification = new NotificationModel(notification);
          await newNotification.save();

          // Update reservation to mark notification sent
          reservation.notification30MinSent = true;
          await reservation.save();
        }
      }
    } catch (error) {
      console.error(`Error sending 30-min prior notification for reservation ${reservation._id}:`, error);
    }
  }
};

cron.schedule('*/1 * * * *', async () => {
  try {
    await sendNotification30MinPrior();
  } catch (err) {
    console.error('Error in 30-min prior notification job:', err);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
