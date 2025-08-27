import React from 'react';

const Specimen = ({ specimen }) => {
  if (!specimen) {
    return <div>Specimen not found.</div>;
  }

  return (
    <div className="specimen">
      <h2>{specimen.name}</h2>
      {specimen.image && <img src={specimen.image} alt={specimen.name} />}
      
      <p>
        <strong>Time Period:</strong> {specimen.epoch} {specimen.time_period}
      </p>
      <p>
        <strong>Found In:</strong> {specimen.location}
      </p>
      <p>{specimen.description}</p>
    </div>
  );
};

export default Specimen;