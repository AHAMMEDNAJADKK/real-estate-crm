import mongoose from 'mongoose';

export const TRANSACTION_CATEGORIES = [
  'Booking Collection',
  'Token Advance',
  'Brokerage Payout',
  'Marketing & Ads',
  'Site Maintenance',
  'Legal & Registration',
  'Customer Refund',
  'Office Operations',
  'Other'
];

const transactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['INCOME', 'EXPENSE'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: TRANSACTION_CATEGORIES,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
    index: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  accountType: {
    type: String,
    enum: ['Bank Account', 'Escrow Account', 'Cash in Hand'],
    default: 'Bank Account'
  },
  referenceNumber: {
    type: String,
    trim: true,
    default: ''
  },
  transactionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

transactionSchema.index({ transactionDate: -1, type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
