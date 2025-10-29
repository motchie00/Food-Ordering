const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  username: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['customer', 'staff', 'admin'],
    default: 'customer',
  },
}, {
  timestamps: true,
});

// Compound index to ensure uniqueness of username for staff/admin and email for customers
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);

