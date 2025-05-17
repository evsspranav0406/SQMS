import express from 'express';
import { createReservation, updateReservation, getMyReservation, cancelReservation, autoCancelExpiredReservations, getReservationById } from '../controllers/reservationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reservations → Create reservation
router.post('/', protect, createReservation);

// PUT /api/reservations/:id → Update reservation
router.put('/:id', protect, updateReservation);

// GET /api/reservations/my → Get user's active reservation
router.get('/my', protect, getMyReservation);

// DELETE /api/reservations/:id/cancel → Cancel Reservation
router.delete('/:id/cancel', protect, cancelReservation);

// POST /api/reservations/auto-cancel-expired → Auto cancel expired reservations
router.post('/auto-cancel-expired', protect, autoCancelExpiredReservations);

// GET /api/reservations/:id → Get reservation by id
router.get('/:id', protect, getReservationById);

export default router;
