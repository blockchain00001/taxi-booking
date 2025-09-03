const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  pickup: {
    address: {
      type: String,
      required: [true, 'Pickup address is required']
    },
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    instructions: String
  },
  destination: {
    address: {
      type: String,
      required: [true, 'Destination address is required']
    },
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    instructions: String
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  vehicleType: {
    type: String,
    enum: ['standard', 'premium', 'suv', 'luxury'],
    default: 'standard'
  },
  passengers: {
    type: Number,
    min: [1, 'Minimum 1 passenger required'],
    max: [6, 'Maximum 6 passengers allowed'],
    default: 1
  },
  specialRequests: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'driver_assigned', 'driver_en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  pricing: {
    baseFare: {
      type: Number,
      required: true
    },
    distance: {
      type: Number,
      required: true
    },
    duration: Number,
    vehicleMultiplier: {
      type: Number,
      default: 1.0
    },
    surgeMultiplier: {
      type: Number,
      default: 1.0
    },
    subtotal: Number,
    taxes: Number,
    total: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'cash', 'paypal', 'apple_pay', 'google_pay'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  rideDetails: {
    startTime: Date,
    endTime: Date,
    actualDistance: Number,
    actualDuration: Number,
    route: [{
      lat: Number,
      lng: Number,
      timestamp: Date
    }]
  },
  rating: {
    userRating: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedAt: Date
    },
    driverRating: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      ratedAt: Date
    }
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: String,
      enum: ['user', 'driver', 'system'],
      default: 'user'
    },
    cancelledAt: Date,
    refundAmount: Number
  },
  notifications: {
    sent: [{
      type: { type: String, enum: ['sms', 'email', 'push'] },
      sentAt: Date,
      status: { type: String, enum: ['sent', 'delivered', 'failed'] }
    }]
  },
  metadata: {
    appVersion: String,
    platform: String,
    deviceInfo: String,
    ipAddress: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for ride duration
bookingSchema.virtual('rideDuration').get(function() {
  if (this.rideDetails.startTime && this.rideDetails.endTime) {
    return (this.rideDetails.endTime - this.rideDetails.startTime) / 1000 / 60; // in minutes
  }
  return null;
});

// Virtual for isUpcoming
bookingSchema.virtual('isUpcoming').get(function() {
  return this.scheduledTime > new Date() && this.status === 'confirmed';
});

// Virtual for isActive
bookingSchema.virtual('isActive').get(function() {
  return ['driver_assigned', 'driver_en_route', 'arrived', 'in_progress'].includes(this.status);
});

// Virtual for isCompleted
bookingSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for isCancelled
bookingSchema.virtual('isCancelled').get(function() {
  return this.status === 'cancelled';
});

// Indexes for better query performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ driver: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ scheduledTime: 1 });
bookingSchema.index({ 'pickup.coordinates': '2dsphere' });
bookingSchema.index({ 'destination.coordinates': '2dsphere' });

// Pre-save middleware to calculate pricing
bookingSchema.pre('save', function(next) {
  if (this.isModified('pricing.baseFare') || this.isModified('pricing.distance') || 
      this.isModified('pricing.vehicleMultiplier') || this.isModified('pricing.surgeMultiplier')) {
    
    this.pricing.subtotal = this.pricing.baseFare + (this.pricing.distance * 2.5);
    this.pricing.taxes = this.pricing.subtotal * 0.1; // 10% tax
    this.pricing.total = (this.pricing.subtotal + this.pricing.taxes) * 
                        this.pricing.vehicleMultiplier * this.pricing.surgeMultiplier;
  }
  next();
});

// Static method to get user's booking statistics
bookingSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalSpent: { $sum: '$pricing.total' },
        completedRides: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledRides: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        averageRating: { $avg: '$rating.userRating.rating' }
      }
    }
  ]);
  
  return stats[0] || {
    totalBookings: 0,
    totalSpent: 0,
    completedRides: 0,
    cancelledRides: 0,
    averageRating: 0
  };
};

// Instance method to update ride status
bookingSchema.methods.updateStatus = function(newStatus, metadata = {}) {
  this.status = newStatus;
  
  if (newStatus === 'in_progress' && !this.rideDetails.startTime) {
    this.rideDetails.startTime = new Date();
  } else if (newStatus === 'completed' && !this.rideDetails.endTime) {
    this.rideDetails.endTime = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('Booking', bookingSchema);
