import React, { useState, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import './Overlay.css';
import AnimalDetailsCard from '../shared/AnimalDetailsCard.jsx';

const Overlay = ({ data, onClose, openXray }) => {
  const container = useRef(null);
  const content = useRef(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchCurrentX, setTouchCurrentX] = useState(null);

  useGSAP(() => {
    if (data) {
      gsap.set(content.current, { x: 0, y: 0, autoAlpha: 0 });
      gsap.timeline()
        .to(container.current, { autoAlpha: 1, duration: 0.3 })
        .to(content.current, { y: 0, autoAlpha: 1, duration: 0.3, ease: 'power2.out' });
    }
  }, { dependencies: [data] });

  const handleClose = () => {
    gsap.timeline({ onComplete: onClose })
      .to(content.current, { y: -50, autoAlpha: 0, duration: 0.3, ease: 'power2.in' })
      .to(container.current, { autoAlpha: 0, duration: 0.3 }, "-=0.2");
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    setTouchCurrentX(currentX);
    const diffX = currentX - touchStartX;
    gsap.set(content.current, { x: diffX });
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchCurrentX === null) return;
    const diffX = touchCurrentX - touchStartX;
    if (Math.abs(diffX) > 100) {
      const direction = diffX > 0 ? 'right' : 'left';
      const windowWidth = window.innerWidth;
      gsap.to(content.current, {
        x: direction === 'right' ? windowWidth : -windowWidth,
        autoAlpha: 0,
        duration: 0.3,
        onComplete: onClose,
      });
    } else {
      gsap.to(content.current, { x: 0, duration: 0.3 });
    }
    setTouchStartX(null);
    setTouchCurrentX(null);
  };

  return (
    <div
      className="overlay"
      ref={container}
      onClick={handleClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="overlay-content" ref={content}>
        <div style={{ pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
          {data && <AnimalDetailsCard animal={data} onClose={handleClose} openXray={() => openXray(data)} isCentered={true} />}
        </div>
      </div>
    </div>
  );
};

export default Overlay;