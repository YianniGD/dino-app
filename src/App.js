import React, { useState, useCallback } from 'react';
import World from './components/Globe/Globe';
import Overlay from './components/Overlay/Overlay';
import GlobeControls from './components/Globe/GlobeControls';
import HorizontalTimeline from './components/timeline/HorizontalTimeline';
import timelineData from './timeline.json';
import faunaData from './fauna.json';
import './App.css';
import TimelineOverlay from './components/NewTimeline/TimelineOverlay';
import XRay from './components/XRay/XRay';
import GameModal from './components/DiggingGameModal/GameModal';
import DiggingGameHost from './components/DiggingGameModal/DiggingGameHost';

function App() {
  const [selectedPoint, setSelectedPoint] = useState(null); // Manages overlay visibility
  const [isRotationEnabled, setIsRotationEnabled] = useState(false);
  const [timelineState, setTimelineState] = useState('default');
  const [filter, setFilter] = useState(null);
  const [showNewTimeline, setShowNewTimeline] = useState(false);
  const [showHorizontalTimeline, setShowHorizontalTimeline] = useState(false);
  const [xraySpecimen, setXraySpecimen] = useState(null);
  const [isDiggingGameModalOpen, setIsDiggingGameModalOpen] = useState(false);

  const openXray = (specimen) => setXraySpecimen(specimen);
  const closeXray = () => setXraySpecimen(null);

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

  const handleOpenDiggingGame = useCallback(() => {
    setIsDiggingGameModalOpen(true);
    setSelectedPoint(null); // Close the overlay when opening the game
  }, []);

  const handleCloseDiggingGame = useCallback(() => {
    setIsDiggingGameModalOpen(false);
  }, []);

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

  const toggleNewTimeline = () => {
    setShowNewTimeline(!showNewTimeline);
  };

  const toggleHorizontalTimeline = () => {
    setShowHorizontalTimeline(!showHorizontalTimeline);
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
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100 }}>
          <button onClick={toggleHorizontalTimeline} style={{ backgroundColor: '#4A5568', color: 'white', padding: '10px', marginRight: '10px' }}>Toggle Horizontal Timeline</button>
          <button onClick={toggleNewTimeline} style={{ backgroundColor: '#4A5568', color: 'white', padding: '10px' }}>Toggle New Timeline</button>
        </div>
        <GlobeControls
          isRotationEnabled={isRotationEnabled}
          onToggleRotation={toggleRotation}
        />
        {selectedPoint && <Overlay data={selectedPoint} onClose={handleOverlayClose} openXray={openXray} onOpenDiggingGame={handleOpenDiggingGame} />}
        {showHorizontalTimeline && <HorizontalTimeline
          timelineData={timelineData}
          faunaData={faunaData}
          onFaunaClick={handlePointClick}
          timelineState={timelineState}
          onStateChange={handleTimelineStateChange}
          filter={filter}
          onFilterSelect={handleFilterSelect}
          onClearFilter={handleClearFilter}
        />}
        <TimelineOverlay show={showNewTimeline} onClose={toggleNewTimeline} openXray={openXray} />
        {xraySpecimen && <XRay isOpen={!!xraySpecimen} onClose={closeXray} specimen={xraySpecimen} />}
        <GameModal isOpen={isDiggingGameModalOpen} onClose={handleCloseDiggingGame}>
          <DiggingGameHost />
        </GameModal>
      </main>
    </div>
  );
}

export default App;