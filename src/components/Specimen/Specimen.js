import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import './Specimen.css';

const Specimen = ({ specimen }) => {
  const [isXrayEnabled, setIsXrayEnabled] = useState(false);
  const imageContainerRef = useRef(null);
  const skeletonRef = useRef(null);

  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container || !isXrayEnabled || !skeletonRef.current) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      gsap.to(skeletonRef.current, {
        clipPath: `circle(100px at ${x}px ${y}px)`,
        duration: 0.1,
      });
    };

    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      // Reset clip-path when effect is disabled
      gsap.to(skeletonRef.current, { clipPath: 'circle(0% at 50% 50%)', duration: 0.1 });
    };
  }, [isXrayEnabled]);

  if (!specimen) {
    return <div>Specimen not found.</div>;
  }

  const handleXrayClick = () => {
    setIsXrayEnabled(!isXrayEnabled);
  };

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
        {specimen.skeleton_image && (
          <button onClick={handleXrayClick} className="xray-button">
            {isXrayEnabled ? 'Disable X-Ray' : 'Enable X-Ray'}
          </button>
        )}
      </div>
      <div className="specimen-images" ref={imageContainerRef}>
        {(specimen.overlay_image || specimen.image) && (
          <img
            src={process.env.PUBLIC_URL + (specimen.overlay_image || specimen.image)}
            alt={specimen.name}
            className="specimen-image"
          />
        )}
        {specimen.skeleton_image && (
          <img
            ref={skeletonRef}
            src={process.env.PUBLIC_URL + specimen.skeleton_image}
            alt={`${specimen.name} Skeleton`}
            className="specimen-skeleton"
          />
        )}
      </div>
    </div>
  );
};

export default Specimen;