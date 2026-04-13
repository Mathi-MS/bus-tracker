const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  picture: String,
  mobile: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  googleId: String,
  refreshToken: String, // Store last refresh token for rotation/revocation
  firstLogin: Date,
  lastLogin: Date,
  shareCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 }, // Total views received across all their sessions
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
