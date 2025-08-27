
import React from 'react';

const Species = ({ species, category, subcategory }) => {
  return (
    <div className="species">
      <h2>{subcategory}</h2>
      <ul>
        {species.map((specimen) => (
          <li key={specimen.name}>
            <a href={`#${category}/${subcategory}/${specimen.name}`}>
              {specimen.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Species;
