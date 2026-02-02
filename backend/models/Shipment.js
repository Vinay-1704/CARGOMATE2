const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipment_id: {
    type: String,
    required: true,
    unique: true
  },
  shipper_id: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    required: [true, 'Shipper ID is required']
  },
  from_location: {
    type: String,
    required: [true, 'Pickup location is required'],
    trim: true
  },
  to_location: {
    type: String,
    required: [true, 'Delivery location is required'],
    trim: true
  },
  package_type: {
    type: String,
    required: [true, 'Package type is required'],
    enum: ['electronics', 'furniture', 'clothing','food items', 'books/documents', 'machinery', 'other']
  },
  package_weight: {
    type: Number,
    required: [true, 'Package weight is required'],
    min: [0, 'Weight must be positive']
  },
  package_description: {
    type: String,
    required: [true, 'Package description is required'],
    trim: true
  },
  vehicle_type: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['small_truck', 'medium_truck', 'large_truck', 'trailer', 'pickup', 'van']
  },
  pickup_date: {
    type: String,
    required: [true, 'Pickup date is required']
  },
  special_instructions: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending_bids', 'active', 'in_transit', 'delivered', 'completed', 'cancelled'],
    default: 'pending_bids'
  },
  selected_driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  final_amount: {
    type: Number,
    default: null
  },
  bid_count: {
    type: Number,
    default: 0
  },
   payment_status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  payment_date: {
    type: Date,
    default: null
  },
// ADD THE RATING FIELDS HERE - BEFORE THE CLOSING BRACE
  driver_rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  driver_review: {
    type: String,
    default: ''
  },
  rated_at: {
    type: Date,
    default: null
  }
  
  
}, {
  timestamps: true
});

// Index for faster queries
shipmentSchema.index({ shipper_id: 1, status: 1 });
shipmentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
