import mongoose from 'mongoose';

const siteVisitSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null,
    index: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  assignedExecutive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  visitDate: {
    type: Date,
    required: true,
    index: true
  },
  visitTime: {
    type: String,
    default: '02:00 PM'
  },
  pickupRequired: {
    type: Boolean,
    default: false
  },
  pickupLocation: {
    type: String,
    default: ''
  },
  visitorsCount: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No Show'],
    default: 'Scheduled',
    index: true
  },
  interestRating: {
    type: String,
    enum: ['Very High', 'High', 'Moderate', 'Low', 'Not Interested', 'Pending Feedback'],
    default: 'Pending Feedback'
  },
  feedback: {
    type: String,
    default: ''
  },
  nextActionPlan: {
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

siteVisitSchema.index({ visitDate: 1, status: 1 });

const SiteVisit = mongoose.model('SiteVisit', siteVisitSchema);
export default SiteVisit;
