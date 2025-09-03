import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaUser, FaHistory, FaCreditCard, FaCog, FaMapMarkerAlt, 
  FaPhone, FaEnvelope, FaShieldAlt, FaStar, FaTaxi, FaPlus,
  FaEdit, FaTrash, FaEye, FaBell, FaLocationArrow, FaCalendarAlt,
  FaClock, FaDollarSign, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaArrowUp, FaArrowDown, FaChartLine, FaGift, FaQrcode
} from 'react-icons/fa';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const categories = [
    { id: 'overview', name: 'Overview', icon: <FaChartLine /> },
    { id: 'profile', name: 'Profile', icon: <FaUser /> },
    { id: 'bookings', name: 'My Bookings', icon: <FaHistory /> },
    { id: 'payments', name: 'Payments', icon: <FaCreditCard /> },
    { id: 'notifications', name: 'Notifications', icon: <FaBell /> },
    { id: 'settings', name: 'Settings', icon: <FaCog /> }
  ];

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch bookings
      const bookingsResponse = await axios.get('/api/bookings', { headers });
      setBookings(bookingsResponse.data.bookings || []);

      // Fetch payments
      const paymentsResponse = await axios.get('/api/payments/transactions', { headers });
      setPayments(paymentsResponse.data.transactions || []);

      // Fetch notifications
      const notificationsResponse = await axios.get('/api/notifications', { headers });
      setNotifications(notificationsResponse.data.notifications || []);

      // Calculate stats
      const totalRides = bookingsResponse.data.bookings?.length || 0;
      const totalSpent = paymentsResponse.data.transactions?.reduce((sum, t) => 
        t.type === 'debit' ? sum + t.amount : sum, 0) || 0;
      const avgRating = 4.8; // This would come from backend
      
      setStats({
        totalRides,
        totalSpent: totalSpent.toFixed(2),
        avgRating,
        memberSince: user?.createdAt ? new Date(user.createdAt).getFullYear() : 2023
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.createdAt]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle form changes
  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      updateUser(response.data.user);
      setEditMode(false);
      // Show success message
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message
    }
  };

  // Render Overview Section
  const renderOverviewSection = () => (
    <div className="dashboard-section">
      <div className="overview-stats">
        <div className="stat-card primary">
          <div className="stat-icon">
            <FaTaxi />
          </div>
          <div className="stat-content">
            <h3>Total Rides</h3>
            <p className="stat-number">{stats.totalRides || 0}</p>
            <span className="stat-change positive">
              <FaArrowUp /> +12% this month
            </span>
          </div>
        </div>
        
        <div className="stat-card secondary">
          <div className="stat-icon">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3>Total Spent</h3>
            <p className="stat-number">${stats.totalSpent || '0.00'}</p>
            <span className="stat-change negative">
              <FaArrowDown /> +8% this month
            </span>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">
            <FaStar />
          </div>
          <div className="stat-content">
            <h3>Average Rating</h3>
            <p className="stat-number">{stats.avgRating || '0.0'}</p>
            <span className="stat-change positive">
              <FaArrowUp /> +0.2 this month
            </span>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">
            <FaShieldAlt />
          </div>
          <div className="stat-content">
            <h3>Member Since</h3>
            <p className="stat-number">{stats.memberSince || '2023'}</p>
            <span className="stat-change">Loyal Customer</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary">
            <FaPlus />
            <span>Book a Ride</span>
          </button>
          <button className="action-btn secondary">
            <FaQrcode />
            <span>Scan QR Code</span>
          </button>
          <button className="action-btn success">
            <FaGift />
            <span>Redeem Code</span>
          </button>
          <button className="action-btn info">
            <FaLocationArrow />
            <span>Share Location</span>
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {bookings.slice(0, 3).map((booking, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon">
                <FaTaxi />
              </div>
              <div className="activity-content">
                <h4>{booking.pickupLocation} → {booking.destinationLocation}</h4>
                <p>{new Date(booking.scheduledTime).toLocaleDateString()}</p>
              </div>
              <div className="activity-status">
                <span className={`status-badge ${booking.status}`}>
                  {booking.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Profile Section
  const renderProfileSection = () => (
    <div className="dashboard-section">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <img 
            src={user?.avatar || 'https://via.placeholder.com/120x120/6366f1/ffffff?text=U'} 
            alt={user?.name} 
            className="profile-avatar" 
          />
          <button className="avatar-edit-btn">
            <FaEdit />
          </button>
        </div>
        <div className="profile-info">
          <h2>{user?.name || 'User Name'}</h2>
          <p className="profile-email">
            <FaEnvelope /> {user?.email || 'user@example.com'}
          </p>
          <p className="profile-phone">
            <FaPhone /> {user?.phone || '+1 (555) 123-4567'}
          </p>
          <p className="profile-address">
            <FaMapMarkerAlt /> {user?.address || 'Address not set'}
          </p>
        </div>
        <div className="profile-actions">
          <button 
            className={`btn ${editMode ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>
      
      {editMode ? (
        <div className="profile-edit-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                name="name"
                className="form-input" 
                value={formData.name}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                name="email"
                className="form-input" 
                value={formData.email}
                onChange={handleFormChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                className="form-input" 
                value={formData.phone}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input 
                type="text" 
                name="address"
                className="form-input" 
                value={formData.address}
                onChange={handleFormChange}
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSaveProfile}>
              Save Changes
            </button>
            <button className="btn btn-outline" onClick={() => setEditMode(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FaTaxi />
            </div>
            <div className="stat-content">
              <h3>Total Rides</h3>
              <p className="stat-number">{stats.totalRides || 0}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaStar />
            </div>
            <div className="stat-content">
              <h3>Rating</h3>
              <p className="stat-number">{stats.avgRating || '0.0'}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaShieldAlt />
            </div>
            <div className="stat-content">
              <h3>Member Since</h3>
              <p className="stat-number">{stats.memberSince || '2023'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Bookings Section
  const renderBookingsSection = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>My Bookings</h2>
        <button className="btn btn-primary">
          <FaPlus /> New Booking
        </button>
      </div>
      
      <div className="bookings-filters">
        <button className="filter-btn active">All</button>
        <button className="filter-btn">Upcoming</button>
        <button className="filter-btn">Active</button>
        <button className="filter-btn">Completed</button>
        <button className="filter-btn">Cancelled</button>
      </div>
      
      <div className="bookings-list">
        {loading ? (
          <div className="loading-state">Loading bookings...</div>
        ) : bookings.length > 0 ? (
          bookings.map((booking, index) => (
            <div key={index} className="booking-card">
              <div className="booking-header">
                <h3>{booking.pickupLocation} → {booking.destinationLocation}</h3>
                <span className={`booking-status ${booking.status}`}>
                  {booking.status}
                </span>
              </div>
              <div className="booking-details">
                <div className="booking-location">
                  <FaMapMarkerAlt />
                  <span>{booking.pickupLocation} → {booking.destinationLocation}</span>
                </div>
                <div className="booking-date">
                  <FaCalendarAlt />
                  <span>{new Date(booking.scheduledTime).toLocaleDateString()}</span>
                </div>
                <div className="booking-time">
                  <FaClock />
                  <span>{new Date(booking.scheduledTime).toLocaleTimeString()}</span>
                </div>
                <div className="booking-price">
                  <FaDollarSign />
                  <span>${booking.totalPrice || '0.00'}</span>
                </div>
              </div>
              <div className="booking-actions">
                <button className="btn btn-outline btn-sm">
                  <FaEye /> View Details
                </button>
                {booking.status === 'upcoming' && (
                  <button className="btn btn-secondary btn-sm">
                    <FaEdit /> Modify
                  </button>
                )}
                {booking.status === 'upcoming' && (
                  <button className="btn btn-danger btn-sm">
                    <FaTimesCircle /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <FaTaxi className="empty-icon" />
            <h3>No Bookings Yet</h3>
            <p>Start your journey by booking your first ride!</p>
            <button className="btn btn-primary">Book a Ride</button>
          </div>
        )}
      </div>
    </div>
  );

  // Render Payments Section
  const renderPaymentsSection = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Payment Methods</h2>
        <button className="btn btn-primary">
          <FaPlus /> Add Payment Method
        </button>
      </div>
      
      <div className="payment-methods">
        <div className="payment-card">
          <div className="payment-info">
            <h3>Visa ending in 1234</h3>
            <p>Expires 12/25</p>
          </div>
          <div className="payment-actions">
            <button className="btn btn-outline btn-sm">
              <FaEdit />
            </button>
            <button className="btn btn-outline btn-sm">
              <FaTrash />
            </button>
          </div>
        </div>
        
        <div className="payment-card">
          <div className="payment-info">
            <h3>Mastercard ending in 5678</h3>
            <p>Expires 08/26</p>
          </div>
          <div className="payment-actions">
            <button className="btn btn-outline btn-sm">
              <FaEdit />
            </button>
            <button className="btn btn-outline btn-sm">
              <FaTrash />
            </button>
          </div>
        </div>
      </div>
      
      <h2>Recent Transactions</h2>
      <div className="transactions-list">
        {payments.length > 0 ? (
          payments.map((payment, index) => (
            <div key={index} className="transaction-item">
              <div className="transaction-info">
                <h4>{payment.description || 'Taxi Ride'}</h4>
                <p>{new Date(payment.date).toLocaleDateString()}</p>
              </div>
              <div className="transaction-details">
                <span className={`transaction-amount ${payment.type}`}>
                  {payment.type === 'credit' ? '+' : '-'}${payment.amount}
                </span>
                <span className={`transaction-status ${payment.status}`}>
                  {payment.status === 'completed' && <FaCheckCircle />}
                  {payment.status === 'pending' && <FaExclamationTriangle />}
                  {payment.status === 'failed' && <FaTimesCircle />}
                  {payment.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <FaCreditCard className="empty-icon" />
            <h3>No Transactions Yet</h3>
            <p>Your transaction history will appear here after your first ride.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Notifications Section
  const renderNotificationsSection = () => (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Notifications</h2>
        <button className="btn btn-outline">Mark All as Read</button>
      </div>
      
      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <div key={index} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
              <div className="notification-icon">
                {notification.type === 'booking' && <FaTaxi />}
                {notification.type === 'payment' && <FaCreditCard />}
                {notification.type === 'promo' && <FaGift />}
                {notification.type === 'system' && <FaBell />}
              </div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="notification-actions">
                {!notification.read && (
                  <button className="btn btn-outline btn-sm">Mark Read</button>
                )}
                <button className="btn btn-outline btn-sm">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <FaBell className="empty-icon" />
            <h3>No Notifications</h3>
            <p>You're all caught up! New notifications will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Settings Section
  const renderSettingsSection = () => (
    <div className="dashboard-section">
      <h2>Account Settings</h2>
      <div className="settings-form">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            className="form-input" 
            defaultValue={user?.name}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            className="form-input" 
            defaultValue={user?.email}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input 
            type="tel" 
            className="form-input" 
            defaultValue={user?.phone}
          />
        </div>
        
        <button className="btn btn-primary">Save Changes</button>
      </div>
      
      <h2>Preferences</h2>
      <div className="preferences">
        <div className="preference-item">
          <div className="preference-info">
            <h4>Email Notifications</h4>
            <p>Receive booking confirmations and updates</p>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
          </label>
        </div>
        
        <div className="preference-item">
          <div className="preference-info">
            <h4>SMS Notifications</h4>
            <p>Receive ride updates via text message</p>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked />
            <span className="slider"></span>
          </label>
        </div>
        
        <div className="preference-item">
          <div className="preference-info">
            <h4>Location Services</h4>
            <p>Allow access to location for better service</p>
          </div>
          <label className="toggle">
            <input type="checkbox" />
            <span className="slider"></span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'overview':
        return renderOverviewSection();
      case 'profile':
        return renderProfileSection();
      case 'bookings':
        return renderBookingsSection();
      case 'payments':
        return renderPaymentsSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'settings':
        return renderSettingsSection();
      default:
        return renderOverviewSection();
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name || 'User'}!</p>
        </div>
        
        <div className="dashboard-content">
          <div className="dashboard-sidebar">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
          
          <div className="dashboard-main">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
