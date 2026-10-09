import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
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
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  meetingType: {
    type: String,
    enum: ['Office Meeting', 'Online (Google Meet/Zoom)', 'Client Location', 'Site Discussion'],
    default: 'Office Meeting'
  },
  scheduledDate: {
    type: Date,
    required: true,
    index: true
  },
  time: {
    type: String,
    default: '11:00 AM'
  },
  location: {
    type: String,
    default: 'Head Office'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled',
    index: true
  },
  notes: {
    type: String,
    default: ''
  },
  outcomeFeedback: {
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

meetingSchema.index({ scheduledDate: 1, status: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;
