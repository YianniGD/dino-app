import React, { useState } from 'react';
import World from './components/Globe/Globe';
import SideBar from './components/SideBar';
import data from './fauna.json';
import './App.css';

function App() {
  const [filter, setFilter] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null); // Manages overlay visibility

  const handlePointClick = (point) => {
    setSelectedPoint(point);
    // Logic to show a species detail overlay would go here
  };

  const handleClearFilter = () => {
    setFilter(null);
  };

  // An example of how you might close an overlay
  const handleOverlayClose = () => {
    setSelectedPoint(null);
  };

  return (
    <div className="app-container">
      <SideBar
        data={data}
        onFilterSelect={setFilter}
        onClearFilter={handleClearFilter}
      />
      <main className="content-area">
        <World
          onPointClick={handlePointClick}
          isOverlayOpen={!!selectedPoint}
          isRotationEnabled={true} // Assuming rotation is on by default
          filter={filter}
        />
        {/*
          Your overlay component would go here. Its visibility would
          be controlled by the `selectedPoint` state. For example:
          {selectedPoint && <SpeciesOverlay species={selectedPoint} onClose={handleOverlayClose} />}
        */}
      </main>
    </div>
  );
}

export default App;