const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', [
  auth,
  body('pickup.address').trim().isLength({ min: 5, max: 200 }).withMessage('Pickup address must be between 5 and 200 characters'),
  body('pickup.coordinates.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid pickup latitude'),
  body('pickup.coordinates.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid pickup longitude'),
  body('destination.address').trim().isLength({ min: 5, max: 200 }).withMessage('Destination address must be between 5 and 200 characters'),
  body('destination.coordinates.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid destination latitude'),
  body('destination.coordinates.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid destination longitude'),
  body('scheduledTime').isISO8601().withMessage('Invalid scheduled time'),
  body('vehicleType').isIn(['standard', 'premium', 'suv', 'luxury']).withMessage('Invalid vehicle type'),
  body('passengers').isInt({ min: 1, max: 6 }).withMessage('Passengers must be between 1 and 6'),
  body('payment.method').isIn(['card', 'cash', 'paypal', 'apple_pay', 'google_pay']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      pickup,
      destination,
      scheduledTime,
      vehicleType,
      passengers,
      specialRequests,
      payment
    } = req.body;

    // Calculate distance (simplified - in production, use Google Maps API)
    const distance = calculateDistance(
      pickup.coordinates.lat, pickup.coordinates.lng,
      destination.coordinates.lat, destination.coordinates.lng
    );

    // Calculate pricing
    const baseFare = 25;
    const pricePerKm = 2.5;
    const vehicleMultipliers = {
      standard: 1.0,
      premium: 1.5,
      suv: 1.8,
      luxury: 2.5
    };

    const subtotal = baseFare + (distance * pricePerKm);
    const taxes = subtotal * 0.1; // 10% tax
    const total = (subtotal + taxes) * vehicleMultipliers[vehicleType];

    // Create booking
    const booking = new Booking({
      user: req.user.id,
      pickup,
      destination,
      scheduledTime: new Date(scheduledTime),
      vehicleType,
      passengers,
      specialRequests,
      pricing: {
        baseFare,
        distance,
        vehicleMultiplier: vehicleMultipliers[vehicleType],
        surgeMultiplier: 1.0,
        subtotal,
        taxes,
        total
      },
      payment
    });

    await booking.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'stats.totalBookings': 1 }
    });

    // Populate user details for response
    await booking.populate('user', 'name email phone');

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Server error during booking creation' });
  }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = { user: req.user.id };
    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        { path: 'driver', select: 'name phone avatar vehicle' },
        { path: 'user', select: 'name email phone' }
      ]
    };

    const bookings = await Booking.paginate(query, options);
    
    res.json(bookings);
    
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone avatar')
      .populate('driver', 'name phone avatar vehicle');
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking or is the driver
    if (booking.user._id.toString() !== req.user.id && 
        (!booking.driver || booking.driver._id.toString() !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(booking);
    
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', [
  auth,
  body('status').isIn(['pending', 'confirmed', 'driver_assigned', 'driver_en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status'),
  body('reason').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Reason must be between 1 and 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check permissions
    if (booking.user.toString() !== req.user.id && 
        (!booking.driver || booking.driver.toString() !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status
    await booking.updateStatus(status, { reason });
    
    // If cancelled, handle refund logic
    if (status === 'cancelled' && reason) {
      booking.cancellation.reason = reason;
      booking.cancellation.cancelledBy = req.user.id === booking.user.toString() ? 'user' : 'driver';
      booking.cancellation.cancelledAt = new Date();
      
      // Calculate refund amount based on cancellation time
      const timeUntilRide = new Date(booking.scheduledTime) - new Date();
      const hoursUntilRide = timeUntilRide / (1000 * 60 * 60);
      
      if (hoursUntilRide > 2) {
        booking.cancellation.refundAmount = booking.pricing.total * 0.8; // 80% refund
      } else if (hoursUntilRide > 1) {
        booking.cancellation.refundAmount = booking.pricing.total * 0.5; // 50% refund
      } else {
        booking.cancellation.refundAmount = 0; // No refund
      }
      
      await booking.save();
    }

    // If completed, update user stats
    if (status === 'completed') {
      await User.findByIdAndUpdate(booking.user, {
        $inc: { 
          'stats.totalRides': 1,
          'stats.totalSpent': booking.pricing.total
        }
      });
    }
    
    res.json({ 
      message: 'Booking status updated successfully',
      booking: await booking.populate(['user', 'driver'])
    });
    
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Server error during status update' });
  }
});

// @route   PUT /api/bookings/:id/rating
// @desc    Rate a completed booking
// @access  Private
router.put('/:id/rating', [
  auth,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, comment } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed bookings' });
    }

    // Check if already rated
    if (booking.rating.userRating) {
      return res.status(400).json({ error: 'Booking already rated' });
    }

    // Add rating
    booking.rating.userRating = {
      rating,
      comment,
      ratedAt: new Date()
    };

    await booking.save();

    // Update driver's average rating
    if (booking.driver) {
      const driverStats = await Booking.aggregate([
        { $match: { driver: booking.driver, 'rating.userRating': { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$rating.userRating.rating' } } }
      ]);

      if (driverStats.length > 0) {
        await User.findByIdAndUpdate(booking.driver, {
          'stats.averageRating': Math.round(driverStats[0].avgRating * 10) / 10
        });
      }
    }
    
    res.json({ 
      message: 'Rating submitted successfully',
      rating: booking.rating.userRating
    });
    
  } catch (error) {
    console.error('Submit rating error:', error);
    res.status(500).json({ error: 'Server error during rating submission' });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel a booking
// @access  Private
router.delete('/:id', [
  auth,
  body('reason').trim().isLength({ min: 1, max: 200 }).withMessage('Cancellation reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ error: 'Booking cannot be cancelled' });
    }

    // Update status to cancelled
    await booking.updateStatus('cancelled');
    
    // Add cancellation details
    booking.cancellation = {
      reason,
      cancelledBy: 'user',
      cancelledAt: new Date()
    };

    // Calculate refund amount
    const timeUntilRide = new Date(booking.scheduledTime) - new Date();
    const hoursUntilRide = timeUntilRide / (1000 * 60 * 60);
    
    if (hoursUntilRide > 2) {
      booking.cancellation.refundAmount = booking.pricing.total * 0.8; // 80% refund
    } else if (hoursUntilRide > 1) {
      booking.cancellation.refundAmount = booking.pricing.total * 0.5; // 50% refund
    } else {
      booking.cancellation.refundAmount = 0; // No refund
    }
    
    await booking.save();
    
    res.json({ 
      message: 'Booking cancelled successfully',
      cancellation: booking.cancellation
    });
    
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Server error during cancellation' });
  }
});

// @route   GET /api/bookings/driver/available
// @desc    Get available bookings for drivers
// @access  Private/Driver
router.get('/driver/available', [auth, authorize('driver')], async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in km
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    const query = {
      status: 'confirmed',
      'pickup.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    };

    const bookings = await Booking.find(query)
      .populate('user', 'name phone')
      .sort({ scheduledTime: 1 })
      .limit(20);
    
    res.json(bookings);
    
  } catch (error) {
    console.error('Get available bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

module.exports = router;
