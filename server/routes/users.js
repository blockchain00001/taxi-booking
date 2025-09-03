const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires')
      .populate('bookings', 'pickup destination scheduledTime status pricing.total')
      .populate('paymentMethods');
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, emergencyContact } = req.body;
    
    // Check if phone number is already taken by another user
    if (phone && phone !== req.user.phone) {
      const existingUser = await User.findOne({ phone, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Phone number is already registered by another user' });
      }
    }

    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (emergencyContact) user.emergencyContact = emergencyContact;
    
    await user.save();
    
    // Remove sensitive fields from response
    user.password = undefined;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    res.json({ message: 'Profile updated successfully', user });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error during profile update' });
  }
});

// @route   PUT /api/users/avatar
// @desc    Update user avatar
// @access  Private
router.put('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const user = await User.findById(req.user.id);
    user.avatar = req.file.path; // or cloudinary URL if using cloud storage
    await user.save();
    
    res.json({ message: 'Avatar updated successfully', avatar: user.avatar });
    
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Server error during avatar update' });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  auth,
  body('preferences.notifications.email').optional().isBoolean(),
  body('preferences.notifications.sms').optional().isBoolean(),
  body('preferences.notifications.push').optional().isBoolean(),
  body('preferences.language').optional().isIn(['en', 'es', 'fr', 'de', 'zh']),
  body('preferences.currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  body('preferences.theme').optional().isIn(['light', 'dark', 'auto'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { preferences } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (preferences.notifications) {
      user.preferences.notifications = { ...user.preferences.notifications, ...preferences.notifications };
    }
    
    if (preferences.language) user.preferences.language = preferences.language;
    if (preferences.currency) user.preferences.currency = preferences.currency;
    if (preferences.theme) user.preferences.theme = preferences.theme;
    
    await user.save();
    
    res.json({ message: 'Preferences updated successfully', preferences: user.preferences });
    
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Server error during preferences update' });
  }
});

// @route   POST /api/users/addresses
// @desc    Add new address
// @access  Private
router.post('/addresses', [
  auth,
  body('type').isIn(['home', 'work', 'other']).withMessage('Invalid address type'),
  body('label').trim().isLength({ min: 1, max: 50 }).withMessage('Label is required and must be under 50 characters'),
  body('address').trim().isLength({ min: 5, max: 200 }).withMessage('Address must be between 5 and 200 characters'),
  body('city').trim().isLength({ min: 1, max: 100 }).withMessage('City is required'),
  body('state').trim().isLength({ min: 1, max: 100 }).withMessage('State is required'),
  body('zipCode').trim().isLength({ min: 3, max: 20 }).withMessage('Zip code must be between 3 and 20 characters'),
  body('country').trim().isLength({ min: 1, max: 100 }).withMessage('Country is required'),
  body('coordinates.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('coordinates.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    
    // If this is the first address, make it default
    if (user.addresses.length === 0) {
      req.body.isDefault = true;
    }
    
    // If setting as default, unset other defaults
    if (req.body.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    user.addresses.push(req.body);
    await user.save();
    
    res.status(201).json({ 
      message: 'Address added successfully', 
      address: user.addresses[user.addresses.length - 1] 
    });
    
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Server error during address addition' });
  }
});

// @route   PUT /api/users/addresses/:id
// @desc    Update address
// @access  Private
router.put('/addresses/:id', [
  auth,
  body('type').optional().isIn(['home', 'work', 'other']),
  body('label').optional().trim().isLength({ min: 1, max: 50 }),
  body('address').optional().trim().isLength({ min: 5, max: 200 }),
  body('city').optional().trim().isLength({ min: 1, max: 100 }),
  body('state').optional().trim().isLength({ min: 1, max: 100 }),
  body('zipCode').optional().trim().isLength({ min: 3, max: 20 }),
  body('country').optional().trim().isLength({ min: 1, max: 100 }),
  body('coordinates.lat').optional().isFloat({ min: -90, max: 90 }),
  body('coordinates.lng').optional().isFloat({ min: -180, max: 180 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.id);
    
    if (addressIndex === -1) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    // If setting as default, unset other defaults
    if (req.body.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    // Update address
    user.addresses[addressIndex] = { ...user.addresses[addressIndex].toObject(), ...req.body };
    await user.save();
    
    res.json({ 
      message: 'Address updated successfully', 
      address: user.addresses[addressIndex] 
    });
    
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Server error during address update' });
  }
});

// @route   DELETE /api/users/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/addresses/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.id);
    
    if (addressIndex === -1) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    const deletedAddress = user.addresses[addressIndex];
    user.addresses.splice(addressIndex, 1);
    
    // If deleted address was default and there are other addresses, set first one as default
    if (deletedAddress.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    res.json({ message: 'Address deleted successfully' });
    
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Server error during address deletion' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const stats = {
      totalRides: user.stats.totalRides,
      totalSpent: user.stats.totalSpent,
      averageRating: user.stats.averageRating,
      memberSince: user.stats.memberSince,
      memberDuration: user.memberDuration
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', [
  auth,
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error during password change' });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  auth,
  body('password').exists().withMessage('Password is required for account deletion')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }
    
    // Soft delete - mark as banned instead of actually deleting
    user.status = 'banned';
    user.bannedAt = new Date();
    await user.save();
    
    res.json({ message: 'Account deleted successfully' });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error during account deletion' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private/Admin
router.get('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationToken -verificationExpires -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
