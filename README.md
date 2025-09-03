# TaxiGo - Professional Taxi Booking Website

A modern, responsive taxi booking website built with React, featuring user authentication, dashboard with categorized functions, and a comprehensive booking system.

## Features

### 🏠 Home Page
- Hero section with call-to-action buttons
- Feature highlights showcasing service benefits
- How it works section with step-by-step guide
- Professional design with modern UI/UX

### 🔐 Authentication System
- User registration and login
- Protected routes for authenticated users
- Automatic redirect to dashboard after successful signup/login
- Secure token-based authentication

### 📊 Dashboard with Categorized Functions
The dashboard is organized into categories that appear when buttons are pressed:

#### Profile Section
- User profile information display
- Statistics cards (Total Rides, Rating, Member Since)
- User avatar and personal details

#### My Bookings Section
- List of past, active, and upcoming bookings
- Booking status indicators (Completed, Active, Upcoming)
- Trip details including locations, dates, and prices

#### Payments Section
- Payment methods management
- Recent transaction history
- Add new payment method functionality

#### Settings Section
- Account information editing
- Notification preferences
- Location services toggle

### 🚕 Booking System
- Comprehensive booking form with pickup/destination
- Vehicle type selection with pricing
- Date and time picker
- Passenger count selection
- Special requests input
- Real-time price estimation
- Booking confirmation with summary

### 🎨 Design Features
- Modern, responsive design
- Mobile-first approach
- Smooth animations and transitions
- Professional color scheme
- Icon integration with React Icons
- CSS custom properties for theming

## Technology Stack

- **Frontend**: React 18.2.0
- **Routing**: React Router DOM 6.8.0
- **Styling**: CSS3 with custom properties
- **Icons**: React Icons 4.7.1
- **State Management**: React Context API
- **Build Tool**: Create React App

## Project Structure

```
src/
├── components/
│   ├── Navbar.js          # Navigation component
│   └── Navbar.css
├── contexts/
│   └── AuthContext.js     # Authentication context
├── pages/
│   ├── Home.js            # Home page
│   ├── Home.css
│   ├── Login.js           # Login page
│   ├── Signup.js          # Signup page
│   ├── Dashboard.js       # Dashboard with categories
│   ├── Dashboard.css
│   ├── Booking.js         # Booking page
│   ├── Booking.css
│   └── Auth.css           # Shared auth styles
├── App.js                 # Main app component
├── App.css                # App-specific styles
├── index.js               # Entry point
└── index.css              # Global styles
```

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd taxi-booking-website
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App

## Key Features Implementation

### Authentication Flow
- Users can sign up with name, email, phone, and password
- Login with email and password
- Automatic redirect to dashboard after authentication
- Protected routes ensure only authenticated users access certain pages

### Dashboard Categories
The dashboard implements a tabbed interface where:
- **Profile**: Shows user stats and information
- **Bookings**: Displays trip history and current bookings
- **Payments**: Manages payment methods and transaction history
- **Settings**: Allows profile editing and preference management

Each category is loaded dynamically when the corresponding button is clicked, providing a clean and organized user experience.

### Responsive Design
- Mobile-first responsive design
- Collapsible navigation menu for mobile devices
- Adaptive grid layouts
- Touch-friendly interface elements

## Customization

### Colors and Themes
The application uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #2563eb;
  --primary-dark: #1d4ed8;
  --secondary-color: #f59e0b;
  --accent-color: #10b981;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
}
```

### Adding New Dashboard Categories
To add new dashboard categories:

1. Add the category to the `categories` array in `Dashboard.js`
2. Create a render function for the new section
3. Add the case to the `renderContent` switch statement
4. Style the new section in `Dashboard.css`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Future Enhancements

- Real-time driver tracking
- Payment gateway integration
- Push notifications
- Multi-language support
- Advanced booking features (scheduled rides, recurring bookings)
- Driver rating system
- Ride history analytics
- Integration with mapping services

## Support

For support and questions, please open an issue in the repository or contact the development team.
