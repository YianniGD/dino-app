import React from 'react';
import './SideBar.css';

// A sidebar component with collapse/expand functionality.
// You can integrate your existing filter logic into this structure.
const SideBar = ({ isCollapsed, onToggle, onFilterSelect, onClearFilter, data }) => {
  return (
    <div className={`sidebar-container ${isCollapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-content">
          <h2>Dino-App</h2>
          <p>Use the controls below to filter the species shown on the globe.</p>
          <button onClick={onClearFilter} className="clear-filter-btn">Clear All Filters</button>
          
          {/* Example filter group, you can add more here */}
          <div className="filter-group">
            <h3>Filter by Type</h3>
            {Object.keys(data).map(type => (
              <button key={type} onClick={() => onFilterSelect({ type: 'type', value: type })}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </aside>
      <button onClick={onToggle} className="sidebar-toggle" title={isCollapsed ? 'Open sidebar' : 'Collapse sidebar'}>
        {isCollapsed ? '》' : '《'}
      </button>
    </div>
  );
};

export default SideBar;
