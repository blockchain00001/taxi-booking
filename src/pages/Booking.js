import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// import { FaMapMarkerAlt, FaCalendar, FaClock, FaCar, FaCreditCard, FaUser } from 'react-icons/fa';
import './Booking.css';

const Booking = () => {
  const { user } = useAuth();
  const [bookingData, setBookingData] = useState({
    pickup: '',
    destination: '',
    date: '',
    time: '',
    vehicleType: 'standard',
    passengers: 1,
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const vehicleTypes = [
    { id: 'standard', name: 'Standard Taxi', price: 1.0, icon: '🚗' },
    { id: 'premium', name: 'Premium Sedan', price: 1.5, icon: '🚙' },
    { id: 'suv', name: 'SUV', price: 1.8, icon: '🚐' },
    { id: 'luxury', name: 'Luxury Vehicle', price: 2.5, icon: '🏎️' }
  ];

  const handleChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  const calculateEstimatedPrice = () => {
    const basePrice = 25; // Base fare
    const selectedVehicle = vehicleTypes.find(v => v.id === bookingData.vehicleType);
    const multiplier = selectedVehicle ? selectedVehicle.price : 1.0;
    
    // Simple distance calculation (in real app, this would use actual distance)
    const estimatedDistance = 15; // km
    const pricePerKm = 2.5;
    
    return (basePrice + (estimatedDistance * pricePerKm)) * multiplier;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSuccess(true);
    setLoading(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSuccess(false);
      setBookingData({
        pickup: '',
        destination: '',
        date: '',
        time: '',
        vehicleType: 'standard',
        passengers: 1,
        specialRequests: ''
      });
    }, 3000);
  };

  if (success) {
    return (
      <div className="booking-success">
        <div className="container">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h1>Booking Confirmed!</h1>
            <p>Your taxi has been booked successfully. You'll receive a confirmation email shortly.</p>
            <div className="booking-summary">
              <h3>Booking Details</h3>
              <div className="summary-item">
                <strong>From:</strong> {bookingData.pickup}
              </div>
              <div className="summary-item">
                <strong>To:</strong> {bookingData.destination}
              </div>
              <div className="summary-item">
                <strong>Date:</strong> {bookingData.date}
              </div>
              <div className="summary-item">
                <strong>Time:</strong> {bookingData.time}
              </div>
              <div className="summary-item">
                <strong>Vehicle:</strong> {vehicleTypes.find(v => v.id === bookingData.vehicleType)?.name}
              </div>
              <div className="summary-item">
                <strong>Estimated Price:</strong> ${calculateEstimatedPrice().toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="container">
        <div className="booking-header">
          <h1>Book Your Taxi</h1>
          <p>Enter your trip details and we'll find the perfect ride for you</p>
        </div>

        <div className="booking-content">
          <div className="booking-form-container">
            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {/* <FaMapMarkerAlt className="input-icon" /> */}
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    name="pickup"
                    value={bookingData.pickup}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter pickup address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {/* <FaMapMarkerAlt className="input-icon" /> */}
                    Destination
                  </label>
                  <input
                    type="text"
                    name="destination"
                    value={bookingData.destination}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter destination address"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {/* <FaCalendar className="input-icon" /> */}
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={bookingData.date}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {/* <FaClock className="input-icon" /> */}
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={bookingData.time}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {/* <FaCar className="input-icon" /> */}
                    Vehicle Type
                  </label>
                  <select
                    name="vehicleType"
                    value={bookingData.vehicleType}
                    onChange={handleChange}
                    className="form-input"
                  >
                    {vehicleTypes.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.icon} {vehicle.name} (${vehicle.price}x)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {/* <FaUser className="input-icon" /> */}
                    Passengers
                  </label>
                  <select
                    name="passengers"
                    value={bookingData.passengers}
                    onChange={handleChange}
                    className="form-input"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Passenger' : 'Passengers'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Special Requests (Optional)</label>
                <textarea
                  name="specialRequests"
                  value={bookingData.specialRequests}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Any special requirements or notes for your driver..."
                  rows="3"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary booking-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  'Book Now'
                )}
              </button>
            </form>
          </div>

          <div className="booking-summary-card">
            <h3>Trip Summary</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span>Vehicle Type:</span>
                <span>{vehicleTypes.find(v => v.id === bookingData.vehicleType)?.name}</span>
              </div>
              <div className="summary-item">
                <span>Passengers:</span>
                <span>{bookingData.passengers}</span>
              </div>
              <div className="summary-item">
                <span>Base Fare:</span>
                <span>$25.00</span>
              </div>
              <div className="summary-item">
                <span>Distance (est.):</span>
                <span>15 km</span>
              </div>
              <div className="summary-item">
                <span>Vehicle Multiplier:</span>
                <span>{vehicleTypes.find(v => v.id === bookingData.vehicleType)?.price}x</span>
              </div>
              <div className="summary-item total">
                <span>Estimated Total:</span>
                <span>${calculateEstimatedPrice().toFixed(2)}</span>
              </div>
            </div>

            <div className="booking-features">
              <h4>What's Included:</h4>
              <ul>
                <li>✓ Professional driver</li>
                <li>✓ Clean, well-maintained vehicle</li>
                <li>✓ Real-time tracking</li>
                <li>✓ 24/7 customer support</li>
                <li>✓ Secure payment options</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
