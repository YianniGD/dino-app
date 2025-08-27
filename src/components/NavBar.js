import React from 'react';
import './NavBar.css';

const NavBar = () => {
  return (
    <nav className="main-nav">
      <h1>Dino-App</h1>
      {/* Add navigation links here if needed */}
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
      </ul>
    </nav>
  );
};

export default NavBar;
