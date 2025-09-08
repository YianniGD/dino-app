import React, { useState, useCallback } from 'react';
import World from './components/Globe/Globe';
import Overlay from './components/Overlay/Overlay';
import GlobeControls from './components/Globe/GlobeControls';
import HorizontalTimeline from './components/timeline/HorizontalTimeline';
import timelineData from './timeline.json';
import faunaData from './fauna.json';
import './App.css';

function App() {
  const [selectedPoint, setSelectedPoint] = useState(null); // Manages overlay visibility
  const [isRotationEnabled, setIsRotationEnabled] = useState(false);
  const [timelineState, setTimelineState] = useState('default');
  const [filter, setFilter] = useState(null);

  const handlePointClick = useCallback((point) => {
    console.log('Point clicked in App.js:', point);
    setSelectedPoint(point);
  }, []);

  const handleGlobeBackgroundClick = useCallback(() => {
    setSelectedPoint(null);
  }, []);

  // An example of how you might close an overlay
  const handleOverlayClose = () => {
    setSelectedPoint(null);
  };

  const toggleRotation = () => {
    setIsRotationEnabled(!isRotationEnabled);
  };

  const handleTimelineStateChange = (newState) => {
    setTimelineState(newState);
  };

  const handleFilterSelect = (newFilter) => {
    setFilter(newFilter);
  };

  const handleClearFilter = () => {
    setFilter(null);
  };

  return (
    <div className="app-container">
      <main className={`content-area timeline-${timelineState}`}>
        <World
          onPointClick={handlePointClick}
          onBackgroundClick={handleGlobeBackgroundClick}
          isOverlayOpen={!!selectedPoint}
          isRotationEnabled={isRotationEnabled}
          selectedPoint={selectedPoint}
          filter={filter}
        />
        <GlobeControls 
          isRotationEnabled={isRotationEnabled} 
          onToggleRotation={toggleRotation} 
        />
        {selectedPoint && <Overlay data={selectedPoint} onClose={handleOverlayClose} />}
        <HorizontalTimeline 
          timelineData={timelineData}
          faunaData={faunaData}
          onFaunaClick={handlePointClick}
          timelineState={timelineState}
          onStateChange={handleTimelineStateChange}
          filter={filter}
          onFilterSelect={handleFilterSelect}
          onClearFilter={handleClearFilter}
        />
      </main>
    </div>
  );
}

export default App;