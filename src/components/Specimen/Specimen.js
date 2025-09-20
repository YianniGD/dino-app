import React from 'react';
import { useOverlayMaskEffect } from '../OverlayEffect/OverlayEffect';
import './Specimen.css';

const Specimen = ({ specimen }) => {
  const { ref: maskedImageRef, maskStyles } = useOverlayMaskEffect(); // Move hook call here

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
        {/* Render skeleton image first, so it's underneath */}
        {specimen.skeleton_image && (
          <img
            src={process.env.PUBLIC_URL + specimen.skeleton_image}
            alt={`${specimen.name} Skeleton`}
            className="specimen-skeleton"
          />
        )}
        {(specimen.overlay_image || specimen.image) && (
          <div className="specimen-image-wrapper">
            <img
              ref={maskedImageRef} // Attach the ref here
              style={maskStyles} // Apply the mask styles here
              src={process.env.PUBLIC_URL + (specimen.overlay_image || specimen.image)}
              alt={specimen.name}
              className="specimen-image"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Specimen;
