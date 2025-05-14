  import User from '../models/User.js';
  import bcrypt from 'bcryptjs';
  import jwt from 'jsonwebtoken';
  import {sendEmail} from '../utils/sendEmail.js';
  import crypto from 'node:crypto';


  export const signup = async (req, res) => {
    try {
      const { name, email,phone,password } = req.body;

      // 1. Check if user exists, hash password, and create user in DB
      const existingUser = await User.findOne({ email,phone });
      if (existingUser) return res.status(400).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await User.create({ name, email,phone ,password: hashedPassword });

      // 2. Send welcome email
      const welcomeHTML = `
        <h2>Welcome to Food Techie, ${name}!</h2>
        <p>We're excited to have you join our community of smart diners.</p>
        <p>You can now book tables, track queues, and explore the future of dining with us.</p>
        <br />
        <p>Bon Appétit! 🍽️</p>
        <p><strong>- The Food Techie Team</strong></p>
      `;

      await sendEmail(email, 'Welcome to Food Techie!', welcomeHTML);

      // 3. Respond with success
      res.status(201).json({ message: 'User registered and welcome email sent', user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong during signup' });
    }
  };

  export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find user
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  
    // 🚫 Disallow admin login from user portal
    if (user.isAdmin) {
      return res.status(403).json({ message: 'Admins are not allowed to log in here' });
    }

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
  
      // Create JWT with user name and email
      const token = jwt.sign(
        { userId: user._id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  export const forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
      await user.save();

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      const emailHTML = `
        <h2>Password Reset Request</h2>
        <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
        <p><small>Link expires in 15 minutes.</small></p>
        <p>If you didn't request this, please ignore this email.</p>
      `;

      await sendEmail(email, 'Password Reset Request', emailHTML);
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  };

  export const resetPassword = async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      user.password = await bcrypt.hash(password, 12);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      const emailHTML = `
        <h2>Password Updated</h2>
        <p>Your password has been reset successfully.</p>
      `;

      await sendEmail(user.email, 'Password Updated', emailHTML);
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Something went wrong' });
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

