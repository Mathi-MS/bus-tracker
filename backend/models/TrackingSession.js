const mongoose = require('mongoose');

const trackingSessionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  sharer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: Date,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  totalViews: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

trackingSessionSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('TrackingSession', trackingSessionSchema);
