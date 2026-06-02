import React from 'react';

const WelcomeBanner = ({ userName, greeting, currentDate }) => {
  return (
    <div className="welcome-section">
      <h1>{greeting}, {userName} 👋</h1>
      <p className="welcome-subtitle">Bienvenido nuevamente a Paseos Felices</p>
      <p className="welcome-date">{currentDate}</p>
    </div>
  );
};

export default WelcomeBanner;
