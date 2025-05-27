import express from 'express';
import { clearAllNotifications, deleteNotification, getNotifications, markAsRead } from '../controllers/notificationController.js';
import {authMiddleware} from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.put('/:id/read', authMiddleware, markAsRead);
router.delete('/:id',authMiddleware,deleteNotification);
router.delete('/',authMiddleware,clearAllNotifications)
export default router;
