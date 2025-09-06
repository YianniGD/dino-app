import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import './Overlay.css';
import Specimen from '../Specimen/Specimen';

const Overlay = ({ data, onClose }) => {
  const container = useRef(null);
  const content = useRef(null);

  // useGSAP hook to handle animations when the `data` prop changes.
  useGSAP(() => {
    if (data) {
      // Animate In
      // First, explicitly set the initial state of the content to be animated
      gsap.set(content.current, { y: -50, autoAlpha: 0 });

      gsap.timeline()
        .to(container.current, { autoAlpha: 1, duration: 0.3 })
        .to(content.current, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' });
    }
  }, { dependencies: [data] });

  const handleClose = () => {
    // Animate Out, then call the parent's onClose function on completion.
    gsap.timeline({ onComplete: onClose })
      .to(content.current, { y: -50, autoAlpha: 0, duration: 0.3, ease: 'power2.in' })
      .to(container.current, { autoAlpha: 0, duration: 0.3 }, "-=0.2");
  };

  return (
    <div className="overlay" ref={container} onClick={handleClose}>
      <div className="overlay-content" ref={content} onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={handleClose}>&times;</button>
        {data && <Specimen specimen={data} />}
      </div>
    </div>
  );
};

export default Overlay;
