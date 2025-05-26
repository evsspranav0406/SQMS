import Notification from '../models/Notification.js';

// Get notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId; // Changed from req.user.id to req.user._id
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    let { id } = req.params;
    id = id.trim(); // Trim whitespace from id to avoid CastError
    const userId = req.user.userId; // Changed from req.user.id to req.user._id
    console.log(`markAsRead called with id: ${id}, userId: ${userId}`);
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      console.log(`Notification not found for id: ${id} and userId: ${userId}`);
      return res.status(404).json({ message: 'Notification not found' });
    }
    console.log(`Notification marked as read: ${notification}`);
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
