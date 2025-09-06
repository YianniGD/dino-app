import React from 'react';
import './Specimen.css';

const Specimen = ({ specimen }) => {
  if (!specimen) {
    return <div>Specimen not found.</div>;
  }

  return (
    <div className="specimen-modal-content">
      <div className="specimen-details">
        <h2>{specimen.name}</h2>
        <p>
          <strong>Time Period:</strong> {specimen.epoch} {specimen.time_period}
        </p>
        <p>
          <strong>Found In:</strong> {specimen.location}
        </p>
        <p>{specimen.description}</p>
      </div>
      <div className="specimen-images">
                        {(specimen.overlay_image || specimen.image) && <img src={process.env.PUBLIC_URL + (specimen.overlay_image || specimen.image)} alt={specimen.name} />}
      </div>
    </div>
  );
};

export default Specimen;