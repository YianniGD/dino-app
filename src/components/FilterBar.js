import React from 'react';
import { groupByLocation } from '../utils/dataProcessor';
import { eras } from '../utils/timeHierarchy';

const FilterBar = ({ type, data, onFilterSelect }) => {
  let options = [];
  let filterKey = '';

  switch (type) {
    case 'time':
      options = eras;
      filterKey = 'era';
      break;
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