// controllers/menuController.js
import MenuItem from "../models/MenuItem.js";

export const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find();

    const groupedItems = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json(groupedItems);
  } catch (err) {
    console.error("Error fetching menu:", err);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
};
// Create a new menu item
export const addMenuItem = async (req, res) => {
    try {
      const newItem = new MenuItem(req.body);
      await newItem.save();
      res.status(201).json(newItem);
    } catch (err) {
      console.log(err)
      res.status(500).json({ error: 'Failed to add menu item' });
    }
  };
  
  // Update a menu item
  export const updateMenuItem = async (req, res) => {
    try {
      const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updatedItem);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  };
  
  // Delete a menu item
  export const deleteMenuItem = async (req, res) => {
    try {
      await MenuItem.findByIdAndDelete(req.params.id);
      res.json({ message: 'Menu item deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete menu item' });
    }
  };

  export const getfeatured = async (req, res) => {
    try {
      const featuredItems = await MenuItem.find({ isFeatured: true }).limit(3); // Adjust limit as needed
      res.json(featuredItems);
    } catch (err) {
      console.error(err); // 🔍 Logs the error if something goes wrong
      res.status(500).json({ error: 'Failed to fetch featured items' });
    }
  };
  