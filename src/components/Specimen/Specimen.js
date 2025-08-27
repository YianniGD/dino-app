
import React from 'react';

const Specimen = ({ specimen }) => {
  return (
    <div className="specimen">
      <h2>{specimen.name}</h2>
      <img src={`https://source.unsplash.com/400x300/?dinosaur,${specimen.name}`} alt={specimen.name} />
      <p>
        <strong>Time Period:</strong> {specimen.time_period}
      </p>
      <p>
        <strong>Location:</strong> {specimen.location}
      </p>
      <p>{specimen.description}</p>
    </div>
  );
};

export default Specimen;
