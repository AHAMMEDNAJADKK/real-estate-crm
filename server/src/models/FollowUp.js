import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scheduledDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Rescheduled', 'Missed'],
    default: 'Pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  outcome: {
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

followUpSchema.index({ scheduledDate: 1, status: 1 });

const FollowUp = mongoose.model('FollowUp', followUpSchema);
export default FollowUp;
