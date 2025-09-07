import React, { useState, useCallback } from 'react';
import World from './components/Globe/Globe';
import Overlay from './components/Overlay/Overlay';
import GlobeControls from './components/Globe/GlobeControls';
import HorizontalTimeline from './components/timeline/HorizontalTimeline';
import NewTimeline from './components/NewTimeline/NewTimeline';
import data from './fauna.json';
import timelineData from './timeline.json';
import './App.css';

function App() {
  const [filter, setFilter] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null); // Manages overlay visibility
  const [isRotationEnabled, setIsRotationEnabled] = useState(false);
  const [timelineDisplayState, setTimelineDisplayState] = useState('default'); // New state for timeline
  const [showNewTimeline, setShowNewTimeline] = useState(false);

  const handlePointClick = useCallback((point) => {
    console.log('Point clicked in App.js:', point);
    setSelectedPoint(point);
  }, []);

  const handleGlobeBackgroundClick = useCallback(() => {
    setSelectedPoint(null);
  }, []);

  const handleClearFilter = () => {
    setFilter(null);
  };

  // An example of how you might close an overlay
  const handleOverlayClose = () => {
    setSelectedPoint(null);
  };

  const toggleRotation = () => {
    setIsRotationEnabled(!isRotationEnabled);
  };

  const handleTimelineStateChange = useCallback((newState) => {
    setTimelineDisplayState(newState);
  }, []);

  const handleOpenNewTimeline = () => {
    setShowNewTimeline(true);
  };

  const handleCloseNewTimeline = () => {
    setShowNewTimeline(false);
  };

  return (
    <div className="app-container">
      <main className={`content-area ${timelineDisplayState === 'collapsed' ? 'timeline-collapsed' : ''}`}>
        <World
          onPointClick={handlePointClick}
          onBackgroundClick={handleGlobeBackgroundClick}
          isOverlayOpen={!!selectedPoint}
          isRotationEnabled={isRotationEnabled}
          filter={filter}
          selectedPoint={selectedPoint}
        />
        <GlobeControls 
          isRotationEnabled={isRotationEnabled} 
          onToggleRotation={toggleRotation} 
          onOpenNewTimeline={handleOpenNewTimeline} 
        />
        <div style={{ display: 'none' }}>
          <HorizontalTimeline
            timelineData={timelineData}
            faunaData={data}
            onFaunaClick={handlePointClick}
            timelineState={timelineDisplayState}
            onStateChange={handleTimelineStateChange}
            filter={filter}
            onFilterSelect={setFilter}
            onClearFilter={handleClearFilter}
          />
        </div>
        {selectedPoint && <Overlay data={selectedPoint} onClose={handleOverlayClose} />}
        {showNewTimeline && <NewTimeline data={timelineData} onClose={handleCloseNewTimeline} />}
      </main>
    </div>
  );
}

export default App;