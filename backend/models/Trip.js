const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  trip_id: {
    type: String,
    required: true,
    unique: true
  },
  shipment_id: {
    type: String,
    required: [true, 'Shipment ID is required']
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver ID is required']
  },
  shipper_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Shipper ID is required']
  },
  status: {
    type: String,
    enum: ['active', 'in_transit', 'completed', 'cancelled'],
    default: 'active'
  },
  started_at: {
    type: Date,
    default: null
  },
  completed_at: {
    type: Date,
    default: null
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: null
  },
  review: {
    type: String,
    default: '',
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
tripSchema.index({ driver_id: 1, status: 1 });
tripSchema.index({ shipper_id: 1, createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
