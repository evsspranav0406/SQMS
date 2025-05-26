import express from 'express';
import { createReservation, updateReservation, getMyReservation, cancelReservation, getReservationById, checkInReservation,completeReservation, getReservationByQuery } from '../controllers/reservationController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// POST /api/reservations → Create reservation
router.post('/', protect, createReservation);

// PUT /api/reservations/:id → Update reservation
router.put('/:id', protect, updateReservation);

// POST /api/reservations/:id/checkin → Check-in reservation
router.post('/:id/checkin', isAdmin, checkInReservation);

// GET /api/reservations/my → Get user's active reservation
router.get('/my', protect, getMyReservation);

// DELETE /api/reservations/:id/cancel → Cancel Reservation
router.delete('/:id/cancel', protect, cancelReservation);

// POST /api/reservations/auto-cancel-expired → Auto cancel expired reservations
//router.post('/auto-cancel-expired', protect, autoCancelExpiredReservations);

// GET /api/reservations/:id → Get reservation by id
router.get('/:id', isAdmin, getReservationById);

router.post('/:id/checkout',protect,completeReservation );


export default router;
