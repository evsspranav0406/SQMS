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
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a notification by id
export const deleteNotification = async (req, res) => {
  try {
    let { id } = req.params;
    id = id.trim();
    const userId = req.user.userId;
    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Clear all notifications for a user
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    await Notification.deleteMany({ userId });
    res.json({ message: 'All notifications cleared successfully' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
