import React from 'react';
import './GlobeControls.css';

const GlobeControls = ({ isRotationEnabled, onToggleRotation }) => {
  return (
    <div className="globe-controls">
      <button onClick={onToggleRotation} title={isRotationEnabled ? 'Pause Rotation' : 'Resume Rotation'}>
        {isRotationEnabled ? '❚❚' : '▶'}
      </button>
    </div>
  );
};

export default GlobeControls;