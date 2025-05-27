import Table from '../models/Table.js';

// Create a new table
export const createTable = async (req, res) => {
  try {
    // Check if table number already exists
    const existingTable = await Table.findOne({ tableNumber: req.body.tableNumber });
    if (existingTable) {
      return res.status(400).json({ error: 'Table number already exists' });
    }
    const table = new Table(req.body);
    await table.save();
    res.status(201).json(table);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all tables with assigned waiter names
import Reservation from '../models/Reservation.js';
import Waiter from '../models/Waiter.js';

export const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find();

    // Find all active or checked-in reservations
    const activeReservations = await Reservation.find({
      status: { $in: ['active', 'checked-in'] },
      table: { $ne: null }
    }).populate('waiter');

    // Map tableId to waiter name
    const tableWaiterMap = {};
    activeReservations.forEach(reservation => {
      const tableId = reservation.table.toString();
      if (reservation.waiter && reservation.waiter.name) {
        tableWaiterMap[tableId] = reservation.waiter.name;
      }
    });

    // Add waiterName to each table
    const tablesWithWaiter = tables.map(table => {
      return {
        ...table.toObject(),
        waiterName: tableWaiterMap[table._id.toString()] || 'N/A',
      };
    });

    res.status(200).json(tablesWithWaiter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a table by ID
export const getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.status(200).json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a table by ID
export const updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.status(200).json(table);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a table by ID
export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.status(200).json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
