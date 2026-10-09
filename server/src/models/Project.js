import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: [true, 'Project code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  developer: {
    type: String,
    default: 'KODBRAND Realty Group',
    trim: true
  },
  projectType: {
    type: String,
    enum: ['Residential', 'Commercial', 'Mixed Use', 'Villa Community', 'Plotted Development'],
    default: 'Residential'
  },
  reraNumber: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    address: { type: String, default: '' },
    locality: { type: String, default: '' },
    city: { type: String, required: true, default: 'Bangalore' },
    state: { type: String, default: 'Karnataka' },
    pincode: { type: String, default: '' }
  },
  totalUnits: {
    type: Number,
    default: 0
  },
  availableUnits: {
    type: Number,
    default: 0
  },
  launchDate: {
    type: Date,
    default: Date.now
  },
  possessionDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Under Construction', 'Ready to Move', 'Completed', 'Sold Out'],
    default: 'Under Construction',
    index: true
  },
  amenities: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  },
  brochureUrl: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }]
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

projectSchema.index({ name: 'text', developer: 'text', 'location.city': 'text' });

const Project = mongoose.model('Project', projectSchema);
export default Project;
