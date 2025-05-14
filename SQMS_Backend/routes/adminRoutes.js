import express from 'express';
import { login,getAllReservations,getDashboard,createDefaultAdmin,getProfile } from '../controllers/adminController.js';
import { isAdmin } from '../middleware/isAdmin.js';
const router = express.Router();

router.post('/login', login); // ✅ no middleware here
// Add protected admin routes below
router.get('/dashboard', isAdmin,getDashboard);
router.get('/reservations',isAdmin,getAllReservations);
router.get('/me',isAdmin,getProfile);
router.get('/',createDefaultAdmin);

export default router;
