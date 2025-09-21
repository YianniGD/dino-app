
import React from 'react';
import App from './App.jsx';
import './TimelineOverlay.css';

const TimelineOverlay = ({ show, onClose, openXray }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="timeline-overlay">
      <div className="timeline-overlay-content">
        <button className="timeline-overlay-close" onClick={onClose}>
          &times;
        </button>
        <App openXray={openXray} />
      </div>
    </div>
  );
};

export default TimelineOverlay;
