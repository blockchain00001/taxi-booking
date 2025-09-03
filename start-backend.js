const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for testing
const mockBookings = [
  {
    id: 1,
    pickupLocation: 'Home',
    destinationLocation: 'Airport',
    scheduledTime: '2023-12-15T09:00:00Z',
    status: 'completed',
    totalPrice: 45.00
  },
  {
    id: 2,
    pickupLocation: 'Mall',
    destinationLocation: 'Home',
    scheduledTime: '2023-12-20T14:30:00Z',
    status: 'active',
    totalPrice: 28.50
  },
  {
    id: 3,
    pickupLocation: 'Office',
    destinationLocation: 'Conference Center',
    scheduledTime: '2023-12-25T10:00:00Z',
    status: 'upcoming',
    totalPrice: 32.00
  }
];

const mockPayments = [
  {
    id: 1,
    description: 'Trip to Airport',
    amount: 45.00,
    type: 'debit',
    status: 'completed',
    date: '2023-12-15T09:00:00Z'
  },
  {
    id: 2,
    description: 'Downtown Shopping',
    amount: 28.50,
    type: 'debit',
    status: 'completed',
    date: '2023-12-20T14:30:00Z'
  },
  {
    id: 3,
    description: 'Account Credit',
    amount: 100.00,
    type: 'credit',
    status: 'completed',
    date: '2023-12-10T00:00:00Z'
  }
];

const mockNotifications = [
  {
    id: 1,
    title: 'Booking Confirmed',
    message: 'Your trip to Airport has been confirmed for Dec 15, 9:00 AM',
    type: 'booking',
    read: false,
    createdAt: '2023-12-14T10:00:00Z'
  },
  {
    id: 2,
    title: 'Payment Successful',
    message: 'Payment of $28.50 for Downtown Shopping has been processed',
    type: 'payment',
    read: true,
    createdAt: '2023-12-20T15:00:00Z'
  },
  {
    id: 3,
    title: 'Special Offer',
    message: 'Get 20% off your next ride! Use code SAVE20',
    type: 'promo',
    read: false,
    createdAt: '2023-12-22T12:00:00Z'
  }
];

// Routes
app.get('/api/bookings', (req, res) => {
  res.json({ bookings: mockBookings });
});

app.get('/api/payments/transactions', (req, res) => {
  res.json({ transactions: mockPayments });
});

app.get('/api/notifications', (req, res) => {
  res.json({ notifications: mockNotifications });
});

app.put('/api/users/profile', (req, res) => {
  // Mock profile update
  res.json({ 
    user: { 
      ...req.body, 
      id: 1,
      createdAt: '2023-01-01T00:00:00Z'
    } 
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
