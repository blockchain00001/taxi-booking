import React from 'react';
import { Link } from 'react-router-dom';
import { FaTaxi, FaShieldAlt, FaClock, FaMapMarkerAlt, FaStar, FaUsers } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Professional Taxi Service
                <span className="highlight"> You Can Trust</span>
              </h1>
              <p className="hero-description">
                Experience reliable, safe, and comfortable taxi rides with our professional drivers. 
                Book your ride in seconds and enjoy premium service at affordable rates.
              </p>
              <div className="hero-buttons">
                <Link to="/signup" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/booking" className="btn btn-outline">
                  Book Now
                </Link>
              </div>
            </div>
            <div className="hero-image">
              <img 
                src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop" 
                alt="Professional taxi service" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features">
        <div className="container">
          <div className="section-header text-center">
            <h2>Why Choose TaxiGo?</h2>
            <p>We provide the best taxi service experience with these key features</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaShieldAlt />
              </div>
              <h3>Safe & Secure</h3>
              <p>All our drivers are verified and vehicles are regularly inspected for your safety.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaClock />
              </div>
              <h3>24/7 Service</h3>
              <p>Available round the clock to serve you whenever you need a ride.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaMapMarkerAlt />
              </div>
              <h3>Real-time Tracking</h3>
              <p>Track your ride in real-time and know exactly when your taxi will arrive.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaTaxi />
              </div>
              <h3>Professional Drivers</h3>
              <p>Experienced and courteous drivers who know the city like the back of their hand.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaStar />
              </div>
              <h3>Premium Quality</h3>
              <p>Clean, well-maintained vehicles with modern amenities for your comfort.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FaUsers />
              </div>
              <h3>Customer Support</h3>
              <p>24/7 customer support to assist you with any queries or issues.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section how-it-works">
        <div className="container">
          <div className="section-header text-center">
            <h2>How It Works</h2>
            <p>Book your taxi in just 3 simple steps</p>
          </div>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create your account in minutes with just your basic information.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Book Your Ride</h3>
              <p>Enter your pickup and destination locations, choose your vehicle type.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Enjoy Your Ride</h3>
              <p>Your driver will arrive at your location and take you to your destination safely.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta">
        <div className="container">
          <div className="cta-content text-center">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of satisfied customers who trust TaxiGo for their transportation needs.</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary">
                Sign Up Now
              </Link>
              <Link to="/login" className="btn btn-outline">
                Already have an account? Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
