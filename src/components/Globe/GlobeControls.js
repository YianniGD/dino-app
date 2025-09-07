import React from 'react';
import './GlobeControls.css';

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 5.5V18.5L19 12L5 5.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TimelineIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GlobeControls = ({ isRotationEnabled, onToggleRotation, onOpenNewTimeline }) => {
  return (
    <div className="globe-controls-container">
      <button onClick={onToggleRotation} title={isRotationEnabled ? 'Pause Rotation' : 'Resume Rotation'}>
        {isRotationEnabled ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button onClick={onOpenNewTimeline} title="Open Timeline">
        <TimelineIcon />
      </button>
    </div>
  );
};

export default GlobeControls;
