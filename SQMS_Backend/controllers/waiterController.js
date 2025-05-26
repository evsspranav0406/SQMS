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

// Get all waiters
export const getAllWaiters = async (req, res) => {
  try {
    const waiters = await Waiter.find();
    res.status(200).json(waiters);
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
