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
    transactionIds: { type: [String], default: [] }
  }
}, { timestamps: true });

export default mongoose.model('Reservation', reservationSchema);
