import mongoose from 'mongoose';

export const CALL_OUTCOMES = [
  'Connected',
  'Interested',
  'Not Interested',
  'Busy',
  'RNT', // Ringing Not Taken
  'Switched Off',
  'Call Back',
  'Wrong Number'
];

const callLogSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },
  telecaller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  callOutcome: {
    type: String,
    enum: CALL_OUTCOMES,
    required: true
  },
  temperature: {
    type: String,
    enum: ['Hot', 'Warm', 'Cold', 'SwitchedOff', 'RNT', 'Call Back'],
    default: 'Warm'
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  callDurationSeconds: {
    type: Number,
    default: 0
  },
  scheduledNextFollowUp: {
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

callLogSchema.index({ createdAt: -1 });

const CallLog = mongoose.model('CallLog', callLogSchema);
export default CallLog;
