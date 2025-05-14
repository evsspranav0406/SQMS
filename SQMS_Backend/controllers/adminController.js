import express from 'express';
const router = express.Router();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Reservation from '../models/Reservation.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';


export const createDefaultAdmin = async () => {
  const adminEmail = 'admin@foodtechie.com';
  const adminPhone = 9999999999;
  const adminPassword = 'Admin@123'; // You can make this env-based if needed

  try {
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const admin = new User({
        name: 'Super Admin',
        email: adminEmail,
        phone: adminPhone,
        password: hashedPassword,
        isAdmin: true
      });

      await admin.save();
      console.log(`✅ Admin created: ${adminEmail}`);
    } else {
      console.log('✅ Admin already exists');
    }
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const admin = await User.findOne({ email });

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Not an admin.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: admin._id,
        email: admin.email,
        isAdmin: true,
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        isAdmin: admin.isAdmin,
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.status(200).json(reservations);
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    res.status(500).json({ message: 'Server Error: Unable to fetch reservations' });
  }
};
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



export const getDashboard=async(req,res)=> {
  try{
    res.json({ message: 'Welcome Admin!' });
  }
  catch(err){
    console.error(err);
  }
};