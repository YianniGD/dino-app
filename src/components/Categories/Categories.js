import React from 'react';

const Categories = ({ data }) => {
  const categories = Object.keys(data);

  return (
    <div className="categories">
      <h2>Categories</h2>
      <ul>
        {categories.map((category) => (
          <li key={category}>
            <a href={`#${category}`}>{category}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Categories;