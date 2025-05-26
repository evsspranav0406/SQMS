import express from 'express'
const router = express.Router();
import {createWaiter,getAllWaiters,getWaiterById,updateWaiter,deleteWaiter } from '../controllers/waiterController.js';
// Create a new waiter
router.post('/', createWaiter);

// Get all waiters
router.get('/', getAllWaiters);

// Get a waiter by ID
router.get('/:id', getWaiterById);

// Update a waiter by ID
router.put('/:id', updateWaiter);

// Delete a waiter by ID
router.delete('/:id',deleteWaiter);

export default router ;
