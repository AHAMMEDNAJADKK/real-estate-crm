import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true,
    index: true
  },
  alternatePhone: {
    type: String,
    default: ''
  },
  customerType: {
    type: String,
    enum: ['Buyer', 'Investor', 'Broker', 'Tenant'],
    default: 'Buyer'
  },
  idProofType: {
    type: String,
    default: 'Aadhaar / National ID'
  },
  idProofNumber: {
    type: String,
    default: ''
  },
  panNumber: {
    type: String,
    default: ''
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  preferences: {
    propertyType: { type: String, default: 'Apartment' },
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    preferredLocation: { type: String, default: '' },
    minBedrooms: { type: Number, default: 2 }
  },
  originatingLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['Lead Qualified', 'Active Opportunity', 'Booked', 'Closed', 'Inactive'],
    default: 'Active Opportunity'
  },
  shortlistedProperties: [{
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    addedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' }
  }],
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

customerSchema.index({ name: 'text', email: 'text', phone: 'text' });
customerSchema.index({ createdAt: -1 });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
