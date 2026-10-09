import mongoose from 'mongoose';

export const OPPORTUNITY_STAGES = [
  'Qualified',
  'Property Shortlisted',
  'Site Visit Scheduled',
  'Site Visit Completed',
  'Negotiation',
  'Booking Initiated',
  'Closed Won',
  'Closed Lost'
];

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  originatingLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  assignedSalesExecutive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  stage: {
    type: String,
    enum: OPPORTUNITY_STAGES,
    default: 'Qualified',
    index: true
  },
  expectedRevenue: {
    type: Number,
    default: 0
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 20
  },
  expectedCloseDate: {
    type: Date,
    default: null
  },
  nextAction: {
    type: String,
    default: 'Follow up on shortlisted units'
  },
  offersHistory: [{
    offeredAmount: { type: Number, required: true },
    offeredBy: { type: String, default: 'Customer' },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    isAccepted: { type: Boolean, default: false }
  }],
  lostReason: {
    type: String,
    default: ''
  },
  closedAt: {
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

opportunitySchema.index({ stage: 1, expectedCloseDate: 1 });

const Opportunity = mongoose.model('Opportunity', opportunitySchema);
export default Opportunity;
