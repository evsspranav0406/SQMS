import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  guests: { type: Number, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  specialRequests: { type: String },
  qrCode: { type: String },
  status: { type: String, enum: ['active', 'completed', 'cancelled','checked-in'], default: 'active' },
  notification30MinSent: { type: Boolean, default: false },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  waiter: { type: mongoose.Schema.Types.ObjectId, ref: 'Waiter' },
  menu: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name: String,
      price: Number,
      quantity: { type: Number, default: 1 }
    }
  ],
  payment: {
    status: { type: String, default: 'pending' },
    amount: { type: Number, default: 0 },
    refund: { type: Number, default: 0 },
    transactionIds: { type: [String], default: [] }
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comments: { type: String },
    serviceQuality: { type: Number, min: 1, max: 5 },
    foodQuality: { type: Number, min: 1, max: 5 },
    ambiance: { type: Number, min: 1, max: 5 },
    date: { type: Date, default: Date.now }
  }
}, { timestamps: true });

export default mongoose.model('Reservation', reservationSchema);
