
import React from 'react';

const GroupedCategories = ({ data, categoryType }) => {
  const categories = Object.keys(data);

  return (
    <div className="categories">
      <h2>{categoryType === 'time' ? 'Time Periods' : 'Locations'}</h2>
      <ul>
        {categories.map((category) => (
          <li key={category}>
            <a href={`#${categoryType}/${category}`}>{category}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupedCategories;
