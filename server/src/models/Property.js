import mongoose from 'mongoose';

export const PROPERTY_STATUSES = [
  'Available',
  'Reserved',
  'Booked',
  'Sold',
  'On Hold'
];

const propertySchema = new mongoose.Schema({
  unitNumber: {
    type: String,
    required: [true, 'Unit number is required'],
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required'],
    index: true
  },
  blockOrTower: {
    type: String,
    trim: true,
    default: 'Tower A'
  },
  floor: {
    type: Number,
    default: 1
  },
  propertyType: {
    type: String,
    enum: ['1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Villa', 'Commercial', 'Plot'],
    default: '2BHK',
    index: true
  },
  superBuiltUpAreaSqFt: {
    type: Number,
    required: [true, 'Super built-up area is required']
  },
  carpetAreaSqFt: {
    type: Number,
    default: 0
  },
  facing: {
    type: String,
    enum: ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'],
    default: 'East'
  },
  furnishingStatus: {
    type: String,
    enum: ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'],
    default: 'Unfurnished'
  },
  listedPrice: {
    type: Number,
    required: [true, 'Listed price is required'],
    index: true
  },
  minSellingPrice: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: PROPERTY_STATUSES,
    default: 'Available',
    index: true
  },
  reservationExpiresAt: {
    type: Date,
    default: null
  },
  currentBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  features: [{
    type: String
  }],
  photos: [{
    type: String
  }],
  floorPlanUrl: {
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

// Compound unique index: no duplicate unit numbers inside the same project & tower
propertySchema.index({ project: 1, blockOrTower: 1, unitNumber: 1 }, { unique: true });
propertySchema.index({ status: 1, listedPrice: 1 });

const Property = mongoose.model('Property', propertySchema);
export default Property;
