const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// @route   GET /api/payments/methods
// @desc    Get user's payment methods
// @access  Private
router.get('/methods', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('paymentMethods');
    res.json(user.paymentMethods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/payments/methods
// @desc    Add new payment method
// @access  Private
router.post('/methods', [
  auth,
  body('type').isIn(['card', 'paypal', 'apple_pay', 'google_pay']).withMessage('Invalid payment type'),
  body('stripePaymentMethodId').optional().isString().withMessage('Stripe payment method ID is required for cards')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, stripePaymentMethodId, isDefault = false } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // If setting as default, unset other defaults
    if (isDefault) {
      user.paymentMethods.forEach(method => method.isDefault = false);
    }
    
    let paymentMethod = {
      type,
      isDefault
    };
    
    if (type === 'card' && stripePaymentMethodId) {
      // Retrieve payment method details from Stripe
      const stripeMethod = await stripe.paymentMethods.retrieve(stripePaymentMethodId);
      
      paymentMethod = {
        ...paymentMethod,
        last4: stripeMethod.card.last4,
        brand: stripeMethod.card.brand,
        expiryMonth: stripeMethod.card.exp_month,
        expiryYear: stripeMethod.card.exp_year,
        stripePaymentMethodId
      };
    }
    
    user.paymentMethods.push(paymentMethod);
    await user.save();
    
    res.status(201).json({
      message: 'Payment method added successfully',
      paymentMethod: user.paymentMethods[user.paymentMethods.length - 1]
    });
    
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ error: 'Server error during payment method addition' });
  }
});

// @route   PUT /api/payments/methods/:id
// @desc    Update payment method
// @access  Private
router.put('/methods/:id', [
  auth,
  body('isDefault').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isDefault } = req.body;
    
    const user = await User.findById(req.user.id);
    const methodIndex = user.paymentMethods.findIndex(method => method._id.toString() === req.params.id);
    
    if (methodIndex === -1) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // If setting as default, unset other defaults
    if (isDefault) {
      user.paymentMethods.forEach(method => method.isDefault = false);
    }
    
    user.paymentMethods[methodIndex].isDefault = isDefault;
    await user.save();
    
    res.json({
      message: 'Payment method updated successfully',
      paymentMethod: user.paymentMethods[methodIndex]
    });
    
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({ error: 'Server error during payment method update' });
  }
});

// @route   DELETE /api/payments/methods/:id
// @desc    Delete payment method
// @access  Private
router.delete('/methods/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const methodIndex = user.paymentMethods.findIndex(method => method._id.toString() === req.params.id);
    
    if (methodIndex === -1) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    const deletedMethod = user.paymentMethods[methodIndex];
    
    // If deleting default method and there are other methods, set first one as default
    if (deletedMethod.isDefault && user.paymentMethods.length > 1) {
      user.paymentMethods.splice(methodIndex, 1);
      user.paymentMethods[0].isDefault = true;
    } else {
      user.paymentMethods.splice(methodIndex, 1);
    }
    
    await user.save();
    
    res.json({ message: 'Payment method deleted successfully' });
    
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Server error during payment method deletion' });
  }
});

// @route   POST /api/payments/process
// @desc    Process payment for a booking
// @access  Private
router.post('/process', [
  auth,
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('paymentMethodId').isMongoId().withMessage('Valid payment method ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, paymentMethodId, amount } = req.body;
    
    const user = await User.findById(req.user.id);
    const paymentMethod = user.paymentMethods.find(method => method._id.toString() === paymentMethodId);
    
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    let paymentResult;
    
    if (paymentMethod.type === 'card' && paymentMethod.stripePaymentMethodId) {
      // Process payment through Stripe
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          payment_method: paymentMethod.stripePaymentMethodId,
          confirm: true,
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          metadata: {
            bookingId,
            userId: req.user.id
          }
        });
        
        paymentResult = {
          success: paymentIntent.status === 'succeeded',
          transactionId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: paymentIntent.status
        };
        
      } catch (stripeError) {
        console.error('Stripe payment error:', stripeError);
        return res.status(400).json({ 
          error: 'Payment failed', 
          details: stripeError.message 
        });
      }
    } else {
      // For other payment methods, simulate successful payment
      paymentResult = {
        success: true,
        transactionId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount,
        status: 'succeeded'
      };
    }
    
    if (paymentResult.success) {
      // Update booking payment status
      // This would typically be done in a webhook or separate endpoint
      res.json({
        message: 'Payment processed successfully',
        payment: paymentResult
      });
    } else {
      res.status(400).json({
        error: 'Payment failed',
        payment: paymentResult
      });
    }
    
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Server error during payment processing' });
  }
});

// @route   POST /api/payments/refund
// @desc    Process refund for a cancelled booking
// @access  Private
router.post('/refund', [
  auth,
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid refund amount is required'),
  body('reason').trim().isLength({ min: 1, max: 200 }).withMessage('Refund reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId, amount, reason } = req.body;
    
    // In a real application, you would:
    // 1. Verify the booking exists and belongs to the user
    // 2. Check if refund is allowed
    // 3. Process refund through payment processor
    // 4. Update booking status
    
    // For now, simulate successful refund
    const refundResult = {
      success: true,
      refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      reason,
      processedAt: new Date()
    };
    
    res.json({
      message: 'Refund processed successfully',
      refund: refundResult
    });
    
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: 'Server error during refund processing' });
  }
});

// @route   GET /api/payments/transactions
// @desc    Get user's transaction history
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    // In a real application, you would have a separate Transaction model
    // For now, return mock data
    const mockTransactions = [
      {
        id: 'txn_1',
        type: 'payment',
        amount: -45.00,
        currency: 'USD',
        status: 'completed',
        description: 'Trip to Airport',
        date: new Date('2023-12-15'),
        paymentMethod: 'Visa ending in 1234'
      },
      {
        id: 'txn_2',
        type: 'payment',
        amount: -28.50,
        currency: 'USD',
        status: 'completed',
        description: 'Downtown Shopping',
        date: new Date('2023-12-20'),
        paymentMethod: 'Visa ending in 1234'
      },
      {
        id: 'txn_3',
        type: 'refund',
        amount: 22.50,
        currency: 'USD',
        status: 'completed',
        description: 'Refund for cancelled trip',
        date: new Date('2023-12-22'),
        paymentMethod: 'Visa ending in 1234'
      }
    ];
    
    // Filter by type if specified
    let filteredTransactions = mockTransactions;
    if (type) {
      filteredTransactions = mockTransactions.filter(txn => txn.type === type);
    }
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    res.json({
      transactions: paginatedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredTransactions.length,
        pages: Math.ceil(filteredTransactions.length / limit)
      }
    });
    
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/payments/webhook/stripe
// @desc    Handle Stripe webhook events
// @access  Public (but verified by Stripe signature)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        // Handle successful payment
        // Update booking status, send confirmation email, etc.
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        // Handle failed payment
        // Update booking status, send notification, etc.
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

module.exports = router;
