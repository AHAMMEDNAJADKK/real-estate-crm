import mongoose from 'mongoose';

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Follow Up',
  'Interested',
  'Qualified',
  'Converted',
  'Lost'
];

export const LEAD_TEMPERATURES = [
  'Hot',
  'Warm',
  'Cold',
  'SwitchedOff',
  'RNT',
  'Call Back'
];

const leadSchema = new mongoose.Schema({
  leadName: {
    type: String,
    required: [true, 'Lead name is required'],
    trim: true,
    index: true
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    index: true
  },
  alternatePhone: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  source: {
    type: String,
    default: 'Website',
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: LEAD_STATUSES,
    default: 'New',
    index: true
  },
  temperature: {
    type: String,
    enum: LEAD_TEMPERATURES,
    default: 'Warm',
    index: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  budgetMin: {
    type: Number,
    default: 0
  },
  budgetMax: {
    type: Number,
    default: 0
  },
  preferredLocation: {
    type: String,
    trim: true,
    default: ''
  },
  preferredPropertyType: {
    type: String,
    trim: true,
    default: 'Apartment'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
    index: true
  },
  interestedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  interestedProperty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  remarks: {
    type: String,
    default: ''
  },
  nextFollowUpDate: {
    type: Date,
    default: null,
    index: true
  },
  lastContactedAt: {
    type: Date,
    default: null
  },
  lostReason: {
    type: String,
    default: ''
  },
  convertedAt: {
    type: Date,
    default: null
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

leadSchema.index({ leadName: 'text', email: 'text', phone: 'text', remarks: 'text' });
leadSchema.index({ createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
