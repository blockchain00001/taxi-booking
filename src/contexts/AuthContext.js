import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('taxi_token');
    const userData = localStorage.getItem('taxi_user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real app, this would come from API
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: email,
        phone: '+1234567890',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      };
      
      const mockToken = 'mock_jwt_token_' + Date.now();
      
      // Store in localStorage
      localStorage.setItem('taxi_token', mockToken);
      localStorage.setItem('taxi_user', JSON.stringify(mockUser));
      
      setIsAuthenticated(true);
      setUser(mockUser);
      
      return { success: true, user: mockUser };
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const signup = async (userData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real app, this would come from API
      const mockUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      };
      
      const mockToken = 'mock_jwt_token_' + Date.now();
      
      // Store in localStorage
      localStorage.setItem('taxi_token', mockToken);
      localStorage.setItem('taxi_user', JSON.stringify(mockUser));
      
      setIsAuthenticated(true);
      setUser(mockUser);
      
      return { success: true, user: mockUser };
    } catch (error) {
      throw new Error('Signup failed. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('taxi_token');
    localStorage.removeItem('taxi_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('taxi_user', JSON.stringify(updatedUser));
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    signup,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
