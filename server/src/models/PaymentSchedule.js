import mongoose from 'mongoose';

const installmentSchema = new mongoose.Schema({
  milestoneName: {
    type: String,
    required: true,
    trim: true
  },
  percentage: {
    type: Number,
    required: true
  },
  amountDue: {
    type: Number,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue'],
    default: 'Pending'
  }
});

const paymentScheduleSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  installments: [installmentSchema]
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    }
  }
});

const PaymentSchedule = mongoose.model('PaymentSchedule', paymentScheduleSchema);
export default PaymentSchedule;
