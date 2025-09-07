import React, { useEffect, useRef } from 'react';
import { Timeline } from '../../New Time/js/index';
import './NewTimeline.css';

const NewTimeline = ({ data, onClose }) => {
  const timelineRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current && data) {
      const options = {
        // I can add options here if needed
      };
      const timeline = new Timeline(timelineRef.current, data, options);
      // To make sure the timeline is rendered correctly
      window.dispatchEvent(new Event('resize'));
    }
  }, [data]);

  return (
    <div className="new-timeline-overlay">
      <div className="new-timeline-container" ref={timelineRef}></div>
      <button onClick={onClose} className="new-timeline-close-button">Close</button>
    </div>
  );
};

export default NewTimeline;
