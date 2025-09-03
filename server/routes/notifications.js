const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const sendEmail = require('../utils/email');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    // In a real application, you would have a separate Notification model
    // For now, return mock data
    const mockNotifications = [
      {
        id: 'notif_1',
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: 'Your taxi booking for Airport trip has been confirmed.',
        isRead: false,
        createdAt: new Date('2023-12-15T10:00:00Z'),
        data: {
          bookingId: 'booking_1',
          tripType: 'Airport'
        }
      },
      {
        id: 'notif_2',
        type: 'driver_assigned',
        title: 'Driver Assigned',
        message: 'John D. has been assigned to your ride. ETA: 5 minutes.',
        isRead: false,
        createdAt: new Date('2023-12-15T10:05:00Z'),
        data: {
          bookingId: 'booking_1',
          driverName: 'John D.',
          eta: '5 minutes'
        }
      },
      {
        id: 'notif_3',
        type: 'ride_completed',
        title: 'Ride Completed',
        message: 'Your ride has been completed. Please rate your experience.',
        isRead: true,
        createdAt: new Date('2023-12-15T11:00:00Z'),
        data: {
          bookingId: 'booking_1',
          totalAmount: 45.00
        }
      },
      {
        id: 'notif_4',
        type: 'promotion',
        title: 'Special Offer',
        message: 'Get 20% off your next ride this weekend!',
        isRead: false,
        createdAt: new Date('2023-12-14T09:00:00Z'),
        data: {
          discount: '20%',
          validUntil: '2023-12-17'
        }
      }
    ];
    
    let filteredNotifications = mockNotifications;
    
    if (unreadOnly === 'true') {
      filteredNotifications = mockNotifications.filter(notif => !notif.isRead);
    }
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
    
    res.json({
      notifications: paginatedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredNotifications.length,
        pages: Math.ceil(filteredNotifications.length / limit)
      },
      unreadCount: mockNotifications.filter(notif => !notif.isRead).length
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real application, you would update the notification in the database
    // For now, simulate the update
    
    res.json({ 
      message: 'Notification marked as read',
      notificationId: id
    });
    
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    // In a real application, you would update all notifications for the user
    // For now, simulate the update
    
    res.json({ 
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real application, you would delete the notification from the database
    // For now, simulate the deletion
    
    res.json({ 
      message: 'Notification deleted successfully',
      notificationId: id
    });
    
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/notifications/send
// @desc    Send a notification to a user
// @access  Private (admin only in production)
router.post('/send', [
  auth,
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('type').isIn(['booking_confirmed', 'driver_assigned', 'ride_completed', 'promotion', 'system']).withMessage('Invalid notification type'),
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required and must be under 100 characters'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message is required and must be under 500 characters'),
  body('data').optional().isObject().withMessage('Data must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, type, title, message, data } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check user's notification preferences
    const shouldSendEmail = user.preferences.notifications.email;
    const shouldSendSMS = user.preferences.notifications.sms;
    const shouldSendPush = user.preferences.notifications.push;
    
    // Send email notification if enabled
    if (shouldSendEmail) {
      try {
        await sendEmail({
          to: user.email,
          subject: title,
          template: 'notification',
          data: {
            name: user.name,
            message,
            type,
            ...data
          }
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }
    }
    
    // In a real application, you would:
    // 1. Save notification to database
    // 2. Send push notification if enabled
    // 3. Send SMS if enabled
    
    res.json({
      message: 'Notification sent successfully',
      notification: {
        type,
        title,
        message,
        data,
        sentTo: {
          email: shouldSendEmail,
          sms: shouldSendSMS,
          push: shouldSendPush
        }
      }
    });
    
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Server error during notification sending' });
  }
});

// @route   GET /api/notifications/preferences
// @desc    Get user's notification preferences
// @access  Private
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferences.notifications');
    res.json(user.preferences.notifications);
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/notifications/preferences
// @desc    Update user's notification preferences
// @access  Private
router.put('/preferences', [
  auth,
  body('email').optional().isBoolean(),
  body('sms').optional().isBoolean(),
  body('push').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, sms, push } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (email !== undefined) {
      user.preferences.notifications.email = email;
    }
    if (sms !== undefined) {
      user.preferences.notifications.sms = sms;
    }
    if (push !== undefined) {
      user.preferences.notifications.push = push;
    }
    
    await user.save();
    
    res.json({
      message: 'Notification preferences updated successfully',
      preferences: user.preferences.notifications
    });
    
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Server error during preferences update' });
  }
});

// @route   POST /api/notifications/test
// @desc    Send test notification to current user
// @access  Private
router.post('/test', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Send test email notification
    try {
      await sendEmail({
        to: user.email,
        subject: 'Test Notification - TaxiGo',
        template: 'notification',
        data: {
          name: user.name,
          message: 'This is a test notification to verify your email settings.',
          type: 'test'
        }
      });
      
      res.json({
        message: 'Test notification sent successfully',
        sentTo: user.email
      });
      
    } catch (emailError) {
      console.error('Test email failed:', emailError);
      res.status(500).json({ 
        error: 'Failed to send test notification',
        details: emailError.message
      });
    }
    
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: 'Server error during test notification' });
  }
});

module.exports = router;
