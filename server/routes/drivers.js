const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/drivers/profile
// @desc    Get driver profile
// @access  Private/Driver
router.get('/profile', [auth, authorize('driver')], async (req, res) => {
  try {
    const driver = await User.findById(req.user.id)
      .select('-password -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires')
      .populate('bookings', 'pickup destination scheduledTime status pricing.total');
    
    res.json(driver);
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/drivers/profile
// @desc    Update driver profile
// @access  Private/Driver
router.put('/profile', [
  auth, 
  authorize('driver'),
  body('vehicle.make').optional().trim().isLength({ min: 1, max: 50 }),
  body('vehicle.model').optional().trim().isLength({ min: 1, max: 50 }),
  body('vehicle.year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
  body('vehicle.color').optional().trim().isLength({ min: 1, max: 30 }),
  body('vehicle.licensePlate').optional().trim().isLength({ min: 1, max: 20 }),
  body('vehicle.insurance').optional().trim().isLength({ min: 1, max: 100 }),
  body('documents.licenseNumber').optional().trim().isLength({ min: 1, max: 50 }),
  body('documents.licenseExpiry').optional().isISO8601(),
  body('documents.vehicleRegistration').optional().trim().isLength({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { vehicle, documents } = req.body;
    
    const driver = await User.findById(req.user.id);
    
    if (vehicle) {
      driver.vehicle = { ...driver.vehicle, ...vehicle };
    }
    
    if (documents) {
      driver.documents = { ...driver.documents, ...documents };
    }
    
    await driver.save();
    
    // Remove sensitive fields from response
    driver.password = undefined;
    driver.verificationToken = undefined;
    driver.verificationExpires = undefined;
    driver.resetPasswordToken = undefined;
    driver.resetPasswordExpires = undefined;
    
    res.json({ message: 'Driver profile updated successfully', driver });
    
  } catch (error) {
    console.error('Update driver profile error:', error);
    res.status(500).json({ error: 'Server error during profile update' });
  }
});

// @route   GET /api/drivers/bookings
// @desc    Get driver's assigned bookings
// @access  Private/Driver
router.get('/bookings', [auth, authorize('driver')], async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { driver: req.user.id };
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { scheduledTime: 1 },
      populate: [
        { path: 'user', select: 'name phone avatar' },
        { path: 'driver', select: 'name phone avatar vehicle' }
      ]
    };

    const bookings = await Booking.paginate(query, options);
    
    res.json(bookings);
    
  } catch (error) {
    console.error('Get driver bookings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/drivers/bookings/:id/accept
// @desc    Accept a booking assignment
// @access  Private/Driver
router.post('/bookings/:id/accept', [auth, authorize('driver')], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if booking is available for assignment
    if (booking.status !== 'confirmed' || booking.driver) {
      return res.status(400).json({ error: 'Booking is not available for assignment' });
    }

    // Assign driver to booking
    booking.driver = req.user.id;
    booking.status = 'driver_assigned';
    await booking.save();
    
    // Populate user details for response
    await booking.populate(['user', 'driver']);
    
    res.json({
      message: 'Booking accepted successfully',
      booking
    });
    
  } catch (error) {
    console.error('Accept booking error:', error);
    res.status(500).json({ error: 'Server error during booking acceptance' });
  }
});

// @route   POST /api/drivers/bookings/:id/start
// @desc    Start a ride
// @access  Private/Driver
router.post('/bookings/:id/start', [auth, authorize('driver')], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if driver owns this booking
    if (booking.driver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if booking can be started
    if (booking.status !== 'arrived') {
      return res.status(400).json({ error: 'Booking cannot be started yet' });
    }

    // Start the ride
    await booking.updateStatus('in_progress');
    
    res.json({
      message: 'Ride started successfully',
      booking: await booking.populate(['user', 'driver'])
    });
    
  } catch (error) {
    console.error('Start ride error:', error);
    res.status(500).json({ error: 'Server error during ride start' });
  }
});

// @route   POST /api/drivers/bookings/:id/complete
// @desc    Complete a ride
// @access  Private/Driver
router.post('/bookings/:id/complete', [
  auth, 
  authorize('driver'),
  body('actualDistance').optional().isFloat({ min: 0.1 }).withMessage('Actual distance must be positive'),
  body('actualDuration').optional().isFloat({ min: 0.1 }).withMessage('Actual duration must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { actualDistance, actualDuration } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if driver owns this booking
    if (booking.driver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if booking can be completed
    if (booking.status !== 'in_progress') {
      return res.status(400).json({ error: 'Booking cannot be completed yet' });
    }

    // Complete the ride
    await booking.updateStatus('completed');
    
    // Update ride details if provided
    if (actualDistance) {
      booking.rideDetails.actualDistance = actualDistance;
    }
    if (actualDuration) {
      booking.rideDetails.actualDuration = actualDuration;
    }
    
    await booking.save();
    
    res.json({
      message: 'Ride completed successfully',
      booking: await booking.populate(['user', 'driver'])
    });
    
  } catch (error) {
    console.error('Complete ride error:', error);
    res.status(500).json({ error: 'Server error during ride completion' });
  }
});

// @route   PUT /api/drivers/bookings/:id/status
// @desc    Update booking status (driver en route, arrived)
// @access  Private/Driver
router.put('/bookings/:id/status', [
  auth, 
  authorize('driver'),
  body('status').isIn(['driver_en_route', 'arrived']).withMessage('Invalid status for driver'),
  body('location').optional().isObject().withMessage('Location must be an object'),
  body('location.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, location } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if driver owns this booking
    if (booking.driver.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status
    await booking.updateStatus(status);
    
    // Update location if provided
    if (location) {
      booking.rideDetails.route.push({
        lat: location.lat,
        lng: location.lng,
        timestamp: new Date()
      });
    }
    
    await booking.save();
    
    res.json({
      message: 'Booking status updated successfully',
      booking: await booking.populate(['user', 'driver'])
    });
    
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Server error during status update' });
  }
});

// @route   GET /api/drivers/earnings
// @desc    Get driver's earnings
// @access  Private/Driver
router.get('/earnings', [auth, authorize('driver')], async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const earnings = await Booking.aggregate([
      {
        $match: {
          driver: req.user.id,
          status: 'completed',
          'rideDetails.endTime': { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$pricing.total' },
          totalRides: { $sum: 1 },
          averageEarning: { $avg: '$pricing.total' }
        }
      }
    ]);
    
    const result = earnings[0] || {
      totalEarnings: 0,
      totalRides: 0,
      averageEarning: 0
    };
    
    res.json({
      period,
      startDate,
      endDate: now,
      ...result
    });
    
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/drivers/available
// @desc    Get available drivers near a location
// @access  Public
router.get('/available', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in km
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    const drivers = await User.find({
      role: 'driver',
      status: 'active',
      'vehicle.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .select('name phone avatar vehicle stats.averageRating')
    .limit(20);
    
    res.json(drivers);
    
  } catch (error) {
    console.error('Get available drivers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
