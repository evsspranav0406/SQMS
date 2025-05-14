import express from 'express';
import { signup, login, forgotPassword, resetPassword,getProfile } from '../controllers/authController.js';
import {authMiddleware} from '../middleware/auth.js';
const router = express.Router();

router.post('/register', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', authMiddleware, getProfile);

export default router;