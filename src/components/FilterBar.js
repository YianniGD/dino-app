import React from 'react';
import { groupByLocation } from '../utils/dataProcessor';
import { timeHierarchy } from '../utils/timeHierarchy';

const FilterBar = ({ type, data, onFilterSelect }) => {
  let options = [];
  let filterKey = '';

  switch (type) {
    case 'era':
      options = Object.keys(timeHierarchy);
      filterKey = 'era';
      break;
    case 'period': {
      // Get all unique period names from the time hierarchy
      const allPeriods = Object.values(timeHierarchy).flatMap(era => Object.keys(era));
      options = [...new Set(allPeriods)];
      filterKey = 'time_period';
      break;
    }
    case 'location':
      options = Object.keys(groupByLocation(data));
      filterKey = 'location';
      break;
    case 'type':
      options = Object.keys(data);
      filterKey = 'type';
      break;
    default:
      return null;
  }

  return (
    <div className="filter-bar">
      {options.sort().map(option => (
        <button
          key={option}
          onClick={() => onFilterSelect({ type: filterKey, value: option })}
        >
          {filterKey === 'era' ? option.replace(' Era', '') : option}
        </button>
      ))}
    </div>
  );
};

export default FilterBar;