import express from 'express';
import { login,getAllReservations,getDashboard,createDefaultAdmin,getProfile} from '../controllers/adminController.js';
import { addMenuItem,updateMenuItem,deleteMenuItem, getMenuItems } from '../controllers/menuController.js';
import { checkInReservation, completeReservation, getReservationById,getReservationByQuery } from '../controllers/reservationController.js';
import { isAdmin } from '../middleware/isAdmin.js';
import { getDashboardStatus, getReservationAnalytics,getFinancialAnalytics } from '../controllers/adminDashboardController.js';

const router = express.Router();

router.post('/login', login); // ✅ no middleware here
// Add protected admin routes below
router.get('/dashboard', isAdmin,getDashboard);
router.get('/dashboard/status', isAdmin, getDashboardStatus);
router.get('/dashboard/reservation-analytics', isAdmin, getReservationAnalytics);
router.get('/dashboard/financial-analytics', isAdmin, getFinancialAnalytics);
router.get('/reservations',isAdmin,getAllReservations);
router.get('/me',isAdmin,getProfile);
router.get('/',createDefaultAdmin);
router.post('/:id/checkin', isAdmin, checkInReservation);
router.post('/:id/checkout',isAdmin,completeReservation)
router.get('/reservations/:id',isAdmin,getReservationById)
router.get('/search',isAdmin ,getReservationByQuery);
export default router;
