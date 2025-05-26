import mongoose from 'mongoose';

const waiterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'occupied'],
    default: 'available',
  },
  currentReservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    default: null,
  },
  currentTableCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const Waiter = mongoose.model('Waiter', waiterSchema);

export default Waiter;
