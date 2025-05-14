import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js'; // adjust path if needed
import reservationRoutes from './routes/reservationRoutes.js'; // ← fixed
import adminAuthRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import cron from 'node-cron';
import Reservation from './models/Reservation.js';
import User from './models/User.js';
import nodemailer from 'nodemailer';
import { autoCancelExpiredReservations } from './controllers/reservationController.js';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://192.168.29.166:3000","http://205.254.168.173:3000","http://172.20.10.3:3000","http://192.168.1.12:3000"],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://192.168.29.166:3000","http://205.254.168.173:3000","http://172.20.10.3:3000","http://192.168.1.12:3000"],
    credentials:true
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

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Function to emit notification to a user
export const sendNotification = (userId, notification) => {
  io.to(userId).emit('notification', notification);
};

cron.schedule('*/1 * * * *', async () => {
  try {
    // Call the autoCancelExpiredReservations function without req, res
    await autoCancelExpiredReservationsInternal();
  } catch (err) {
    console.error('Error in scheduled job:', err);
  }
});

import { parse, isBefore } from 'date-fns';

const autoCancelExpiredReservationsInternal = async () => {
  const now = new Date();
  // Create cutoffTime as local time without timezone offset
  const cutoffTime = new Date(now.getTime() - 30 * 60 * 1000);
  cutoffTime.setMilliseconds(0);
  cutoffTime.setSeconds(0);
  cutoffTime.setMinutes(cutoffTime.getMinutes());
  cutoffTime.setHours(cutoffTime.getHours());

  // Find all active or pending reservations
  const activeReservations = await Reservation.find({
    status: { $in: ['active', 'pending'] },
  });

  const expiredReservations = [];

  for (const reservation of activeReservations) {
    // Combine date and time strings into a Date object (local time) using date-fns parse
    const reservationDateTime = parse(`${reservation.date} ${reservation.time}`, 'yyyy-MM-dd HH:mm', new Date());

    // Logging for debugging

    if (isBefore(reservationDateTime, cutoffTime)) {
      expiredReservations.push(reservation);
    }
  }

  for (const reservation of expiredReservations) {
    reservation.status = 'cancelled';
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

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Reservation Cancelled - Food Techie',
        html: "<h2>Your Reservation Has Been Cancelled</h2>" +
              "<p><strong>Name:</strong> " + reservation.name + "</p>" +
              "<p><strong>Date:</strong> " + reservation.date + "</p>" +
              "<p><strong>Time:</strong> " + reservation.time + "</p>" +
              "<p><strong>Guests:</strong> " + reservation.guests + "</p>" +
              "<p>If this was a mistake, feel free to make another reservation.</p>"
      };

      await transporter.sendMail(mailOptions);
    }
  }
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
