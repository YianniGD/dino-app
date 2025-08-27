import React from "react";
import FilterBar from "./FilterBar";
import "./SideBar.css";

const SideBar = ({
  data,
  onFilterSelect,
  onClearFilter,
  isCollapsed,
  onToggle,
}) => {
  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-content">
        {!isCollapsed && (
          <div className="filter-container">
            <h3>Filters</h3>
            <FilterBar type="era" data={data} onFilterSelect={onFilterSelect} />
            <FilterBar type="period" data={data} onFilterSelect={onFilterSelect} />
            <FilterBar type="location" data={data} onFilterSelect={onFilterSelect} />
            <FilterBar type="type" data={data} onFilterSelect={onFilterSelect} />
            <button onClick={onClearFilter}>Clear All Filters</button>
          </div>
        )}
      </div>
      <button onClick={onToggle} className="sidebar-toggle" title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
        {isCollapsed ? "›" : "‹"}
      </button>
    </aside>
  );
};

export default SideBar;

