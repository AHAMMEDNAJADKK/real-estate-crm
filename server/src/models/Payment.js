import mongoose from 'mongoose';

export const PAYMENT_METHODS = [
  'Bank Transfer (NEFT/RTGS)',
  'Cheque',
  'UPI',
  'Credit Card',
  'Debit Card',
  'Demand Draft',
  'Cash'
];

export const PAYMENT_STATUSES = [
  'Pending',
  'Successful',
  'Failed',
  'Refunded'
];

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  installmentId: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [1, 'Payment amount must be greater than zero']
  },
  paymentMethod: {
    type: String,
    enum: PAYMENT_METHODS,
    default: 'Bank Transfer (NEFT/RTGS)'
  },
  transactionReference: {
    type: String,
    trim: true,
    default: ''
  },
  paymentDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: PAYMENT_STATUSES,
    default: 'Successful',
    index: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  receiptNumber: {
    type: String,
    default: ''
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String,
    default: ''
  },
  refundDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
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

paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
