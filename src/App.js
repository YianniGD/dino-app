import React, { useState, useCallback } from 'react';
import World from './components/Globe/Globe';
import Overlay from './components/Overlay/Overlay';
import GlobeControls from './components/Globe/GlobeControls';
import HorizontalTimeline from './components/timeline/HorizontalTimeline';
import data from './fauna.json';
import timelineData from './timeline.json';
import './App.css';

function App() {
  const [filter, setFilter] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null); // Manages overlay visibility
  const [isRotationEnabled, setIsRotationEnabled] = useState(false);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);

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

  const toggleTimeline = () => {
    setIsTimelineCollapsed(!isTimelineCollapsed);
  };

  return (
    <div className="app-container">
      <main className={`content-area ${isTimelineCollapsed ? 'timeline-collapsed' : ''}`}>
        <World
          onPointClick={handlePointClick}
          onBackgroundClick={handleGlobeBackgroundClick}
          isOverlayOpen={!!selectedPoint}
          isRotationEnabled={isRotationEnabled}
          filter={filter}
          selectedPoint={selectedPoint}
        />
        <GlobeControls isRotationEnabled={isRotationEnabled} onToggleRotation={toggleRotation} />
        <HorizontalTimeline
          timelineData={timelineData}
          faunaData={data}
          onFaunaClick={handlePointClick}
          isCollapsed={isTimelineCollapsed}
          onToggle={toggleTimeline}
          filter={filter}
          onFilterSelect={setFilter}
          onClearFilter={handleClearFilter}
        />
        {selectedPoint && <Overlay data={selectedPoint} onClose={handleOverlayClose} />}
      </main>
    </div>
  );
}

export default App;