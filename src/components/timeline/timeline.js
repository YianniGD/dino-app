import React from 'react';
import { timeHierarchy } from '../../utils/timeHierarchy';
import './Timeline.css';

const Timeline = ({ data, isVisible }) => {
  if (!isVisible || !data) {
    return null;
  }

  const eras = Object.keys(timeHierarchy);

  const findPeriod = (speciesPeriod) => {
    const speciesPeriods = speciesPeriod.split(/-| to /).map(p => p.trim());
    for (const eraName in timeHierarchy) {
      for (const periodName in timeHierarchy[eraName]) {
        const subPeriods = timeHierarchy[eraName][periodName];
        if (speciesPeriods.some(sp => subPeriods.includes(sp))) {
          return periodName;
        }
      }
    }
    return null;
  };

  const activePeriod = findPeriod(data.time_period);

  return (
    <div className={`timeline-container ${isVisible ? 'visible' : ''}`}>
      <div className="timeline-header">
        <h3>Geological Timeline</h3>
        <p>Showing period for: <strong>{data.name}</strong></p>
      </div>
      <div className="timeline-body">
        {eras.map(eraName => (
          <div key={eraName} className="era-segment">
            <div className="era-label">{eraName}</div>
            <div className="periods-track">
              {Object.keys(timeHierarchy[eraName]).map(periodName => (
                <div
                  key={periodName}
                  className={`period-block ${periodName === activePeriod ? 'active' : ''}`}
                  title={`${periodName} Period`}
                >
                  <span className="period-label">{periodName}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
