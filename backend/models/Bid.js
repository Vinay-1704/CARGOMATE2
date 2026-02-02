const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  bid_id: {
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
  bid_amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount must be positive']
  },
  message: {
    type: String,
    default: '',
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  estimated_delivery_time: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
bidSchema.index({ shipment_id: 1, status: 1 });
bidSchema.index({ driver_id: 1, createdAt: -1 });

module.exports = mongoose.model('Bid', bidSchema);
