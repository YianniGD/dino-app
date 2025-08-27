
import React from 'react';

const Subcategories = ({ subcategories, category }) => {
  return (
    <div className="subcategories">
      <h2>{category}</h2>
      <ul>
        {subcategories.map((subcategory) => (
          <li key={subcategory.subcategory_name}>
            <a href={`#${category}/${subcategory.subcategory_name}`}>
              {subcategory.subcategory_name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Subcategories;
