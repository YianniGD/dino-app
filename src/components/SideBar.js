import React from 'react';
import FilterBar from './FilterBar';
import NavBar from './NavBar';
import './SideBar.css';

const SideBar = ({ data, onFilterSelect, onClearFilter }) => {
  return (
    <aside className="sidebar">
      <NavBar />
      <div className="filter-controls">
        <div className="filter-header">
          <h2>Filters</h2>
          <button onClick={onClearFilter} className="clear-filter-btn">Clear</button>
        </div>
        
        <div className="filter-group">
          <h3>Time</h3>
          <FilterBar type="time" data={data} onFilterSelect={onFilterSelect} />
        </div>
        
        <div className="filter-group">
          <h3>Location</h3>
          <FilterBar type="location" data={data} onFilterSelect={onFilterSelect} />
        </div>
        
        <div className="filter-group">
          <h3>Type</h3>
          <FilterBar type="type" data={data} onFilterSelect={onFilterSelect} />
        </div>
      </div>
    </aside>
  );
};

export default SideBar;