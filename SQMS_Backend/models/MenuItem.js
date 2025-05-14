// models/MenuItem.js
import mongoose from "mongoose";
const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['Appetizer', 'Main Dish', 'Dessert', 'Drink','Biryani','Flat Bread'],
    required: true
  },
  isFeatured: { type: Boolean, default: false }, // New field
}, {
  timestamps: true
});

export default mongoose.model('MenuItem', menuItemSchema);
