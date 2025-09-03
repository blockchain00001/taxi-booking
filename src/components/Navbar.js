import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaTaxi, FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            <FaTaxi className="logo-icon" />
            <span>TaxiGo</span>
          </Link>
        </div>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/booking" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Book Now
              </Link>
              <div className="user-menu">
                <div className="user-info">
                  <img src={user?.avatar} alt={user?.name} className="user-avatar" />
                  <span className="user-name">{user?.name}</span>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button className="navbar-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
