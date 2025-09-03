import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaUser, FaHistory, FaCreditCard, FaCog, FaMapMarkerAlt, 
  FaPhone, FaEnvelope, FaShieldAlt, FaStar, FaTaxi 
} from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('profile');

  const categories = [
    { id: 'profile', name: 'Profile', icon: <FaUser /> },
    { id: 'bookings', name: 'My Bookings', icon: <FaHistory /> },
    { id: 'payments', name: 'Payments', icon: <FaCreditCard /> },
    { id: 'settings', name: 'Settings', icon: <FaCog /> }
  ];

  const renderProfileSection = () => (
    <div className="dashboard-section">
      <div className="profile-header">
        <img src={user?.avatar} alt={user?.name} className="profile-avatar" />
        <div className="profile-info">
          <h2>{user?.name}</h2>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-phone">{user?.phone}</p>
        </div>
      </div>
      
      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaTaxi />
          </div>
          <div className="stat-content">
            <h3>Total Rides</h3>
            <p className="stat-number">24</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaStar />
          </div>
          <div className="stat-content">
            <h3>Rating</h3>
            <p className="stat-number">4.8</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaShieldAlt />
          </div>
          <div className="stat-content">
            <h3>Member Since</h3>
            <p className="stat-number">2023</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookingsSection = () => (
    <div className="dashboard-section">
      <h2>My Bookings</h2>
      <div className="bookings-list">
        <div className="booking-card">
          <div className="booking-header">
            <h3>Trip to Airport</h3>
            <span className="booking-status completed">Completed</span>
          </div>
          <div className="booking-details">
            <div className="booking-location">
              <FaMapMarkerAlt />
              <span>Home → Airport</span>
            </div>
            <div className="booking-date">
              <span>Dec 15, 2023 • 9:00 AM</span>
            </div>
            <div className="booking-price">
              <span>$45.00</span>
            </div>
          </div>
        </div>
        
        <div className="booking-card">
          <div className="booking-header">
            <h3>Downtown Shopping</h3>
            <span className="booking-status active">Active</span>
          </div>
          <div className="booking-details">
            <div className="booking-location">
              <FaMapMarkerAlt />
              <span>Mall → Home</span>
            </div>
            <div className="booking-date">
              <span>Dec 20, 2023 • 2:30 PM</span>
            </div>
            <div className="booking-price">
              <span>$28.50</span>
            </div>
          </div>
        </div>
        
        <div className="booking-card">
          <div className="booking-header">
            <h3>Business Meeting</h3>
            <span className="booking-status upcoming">Upcoming</span>
          </div>
          <div className="booking-details">
            <div className="booking-location">
              <FaMapMarkerAlt />
              <span>Office → Conference Center</span>
            </div>
            <div className="booking-date">
              <span>Dec 25, 2023 • 10:00 AM</span>
            </div>
            <div className="booking-price">
              <span>$32.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentsSection = () => (
    <div className="dashboard-section">
      <h2>Payment Methods</h2>
      <div className="payment-methods">
        <div className="payment-card">
          <div className="payment-info">
            <h3>Visa ending in 1234</h3>
            <p>Expires 12/25</p>
          </div>
          <button className="btn btn-outline">Edit</button>
        </div>
        
        <div className="payment-card">
          <div className="payment-info">
            <h3>Mastercard ending in 5678</h3>
            <p>Expires 08/26</p>
          </div>
          <button className="btn btn-outline">Edit</button>
        </div>
        
        <button className="btn btn-primary add-payment">
          + Add New Payment Method
        </button>
      </div>
      
      <h2>Recent Transactions</h2>
      <div className="transactions-list">
        <div className="transaction-item">
          <div className="transaction-info">
            <h4>Trip to Airport</h4>
            <p>Dec 15, 2023</p>
          </div>
          <span className="transaction-amount">-$45.00</span>
        </div>
        
        <div className="transaction-item">
          <div className="transaction-info">
            <h4>Downtown Shopping</h4>
            <p>Dec 20, 2023</p>
          </div>
          <span className="transaction-amount">-$28.50</span>
        </div>
        
        <div className="transaction-item">
          <div className="transaction-info">
            <h4>Account Credit</h4>
            <p>Dec 10, 2023</p>
          </div>
          <span className="transaction-amount credit">+$100.00</span>
        </div>
      </div>
    </div>
  );

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
      case 'profile':
        return renderProfileSection();
      case 'bookings':
        return renderBookingsSection();
      case 'payments':
        return renderPaymentsSection();
      case 'settings':
        return renderSettingsSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}!</p>
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
