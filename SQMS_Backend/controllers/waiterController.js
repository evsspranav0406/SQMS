import Waiter from '../models/Waiter.js';

// Create a new waiter
export const createWaiter = async (req, res) => {
  try {
    // Check if waiter name already exists
    const existingWaiter = await Waiter.findOne({ name: req.body.name });
    if (existingWaiter) {
      return res.status(400).json({ error: 'Waiter name already exists' });
    }
    const waiter = new Waiter(req.body);
    await waiter.save();
    res.status(201).json(waiter);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all waiters with current tables served
import Reservation from '../models/Reservation.js';

export const getAllWaiters = async (req, res) => {
  try {
    const waiters = await Waiter.find();

    // Find all active or checked-in reservations
    const activeReservations = await Reservation.find({
      status: { $in: ['active', 'checked-in'] },
      waiter: { $ne: null }
    }).populate('table');

    // Map waiterId to array of table numbers
    const waiterTablesMap = {};
    activeReservations.forEach(reservation => {
      const waiterId = reservation.waiter.toString();
      if (!waiterTablesMap[waiterId]) {
        waiterTablesMap[waiterId] = [];
      }
      if (reservation.table && reservation.table.tableNumber) {
        waiterTablesMap[waiterId].push(reservation.table.tableNumber);
      }
    });

    // Add currentTables array to each waiter
    const waitersWithTables = waiters.map(waiter => {
      const currentTables = waiterTablesMap[waiter._id.toString()] || [];
      return {
        ...waiter.toObject(),
        currentTables,
      };
    });

    res.status(200).json(waitersWithTables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a waiter by ID
export const getWaiterById = async (req, res) => {
  try {
    const waiter = await Waiter.findById(req.params.id);
    if (!waiter) {
      return res.status(404).json({ error: 'Waiter not found' });
    }
    res.status(200).json(waiter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a waiter by ID
export const updateWaiter = async (req, res) => {
  try {
    const waiter = await Waiter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!waiter) {
      return res.status(404).json({ error: 'Waiter not found' });
    }
    res.status(200).json(waiter);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a waiter by ID
export const deleteWaiter = async (req, res) => {
  try {
    const waiter = await Waiter.findByIdAndDelete(req.params.id);
    if (!waiter) {
      return res.status(404).json({ error: 'Waiter not found' });
    }
    res.status(200).json({ message: 'Waiter deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
