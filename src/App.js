import React, { useState } from 'react';
import World from './components/Globe/Globe';
import SideBar from './components/SideBar';
import Overlay from './components/Overlay/Overlay';
import GlobeControls from './components/Globe/GlobeControls';
import Timeline from './components/timeline/timeline';
import data from './fauna.json';
import './App.css';
import FilterBar from './components/FilterBar';
import { timeHierarchy } from './utils/timeHierarchy';

function App() {
  const [filter, setFilter] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null); // Manages overlay visibility
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRotationEnabled, setIsRotationEnabled] = useState(true);

  const handlePointClick = (point) => {
    setSelectedPoint(point);
  };

  const handleClearFilter = () => {
    setFilter(null);
  };

  // An example of how you might close an overlay
  const handleOverlayClose = () => {
    setSelectedPoint(null);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleRotation = () => {
    setIsRotationEnabled(!isRotationEnabled);
  };

  return (
    <div className="app-container">
      <SideBar
        data={data}
        onFilterSelect={setFilter}
        onClearFilter={handleClearFilter}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <main className="content-area">
        <World
          onPointClick={handlePointClick}
          isOverlayOpen={!!selectedPoint}
          isRotationEnabled={isRotationEnabled}
          filter={filter}
        />
        <GlobeControls isRotationEnabled={isRotationEnabled} onToggleRotation={toggleRotation} />
        <Timeline data={selectedPoint} isVisible={!!selectedPoint} />
        {selectedPoint && <Overlay data={selectedPoint} onClose={handleOverlayClose} />}
      </main>
    </div>
  );
}

export default App;