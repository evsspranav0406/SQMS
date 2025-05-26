import express from 'express';
const router = express.Router();
import { createTable,getAllTables,getTableById,updateTable,deleteTable } from '../controllers/tableController.js';
// Create a new table
router.post('/', createTable);

// Get all tables
router.get('/', getAllTables);

// Get a table by ID
router.get('/:id', getTableById);

// Update a table by ID
router.put('/:id', updateTable);

// Delete a table by ID
router.delete('/:id', deleteTable);

export default router;
