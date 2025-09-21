
import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import './XRay.css';

const XRay = ({ isOpen, onClose, specimen }) => {
  const imageContainerRef = useRef(null);
  const skeletonRef = useRef(null);

  useEffect(() => {
    const container = imageContainerRef.current;
    const skeleton = skeletonRef.current;
    if (!container || !isOpen || !skeleton) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      gsap.to(skeleton, {
        clipPath: `circle(100px at ${x}px ${y}px)`,
        duration: 0.1,
      });
    };

    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      gsap.to(skeleton, { clipPath: 'circle(0% at 50% 50%)', duration: 0.1 });
    };
  }, [isOpen]);

  if (!isOpen || !specimen) {
    return null;
  }

  return (
    <div className="xray-modal" onClick={onClose}>
      <div className="xray-content" onClick={(e) => e.stopPropagation()}>
        <div className="xray-images" ref={imageContainerRef}>
          {(specimen.overlay_image || specimen.image) && (
            <img
              src={process.env.PUBLIC_URL + (specimen.overlay_image || specimen.image)}
              alt={specimen.name}
              className="xray-specimen-image"
            />
          )}
          {specimen.skeleton_image && (
            <img
              ref={skeletonRef}
              src={process.env.PUBLIC_URL + specimen.skeleton_image}
              alt={`${specimen.name} Skeleton`}
              className="xray-specimen-skeleton"
            />
          )}
        </div>
        <button onClick={onClose} className="close-xray-button">Close</button>
      </div>
    </div>
  );
};

export default XRay;
