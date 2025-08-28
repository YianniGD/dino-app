import React, { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import './HorizontalTimeline.css';

// Register the GSAP Draggable plugin
gsap.registerPlugin(Draggable);

// Helper to parse duration strings like "541 to 252 ma"
const parseDuration = (durationStr) => {
    if (!durationStr) return { start: 0, end: 0 };
    // A safe eval for simple math like "11 / 1000" for 'ka' units
    const evaluate = (str) => new Function(`return ${str}`)();
    let processedStr = durationStr.replace(' ma', '').replace(' to present', ' to 0').replace(' to today', ' to 0');
    if (processedStr.includes('ka')) {
        processedStr = processedStr.replace(' ka', ' / 1000');
    }
    const parts = String(processedStr).split(' to ');
    const start = evaluate(parts[0]);
    const end = parts[1] ? evaluate(parts[1]) : start;
    return { start, end };
};


const HorizontalTimeline = ({ timelineData, faunaData, onFaunaClick, isCollapsed, onToggle, filter, onFilterSelect, onClearFilter }) => {
    const timelineContainerRef = useRef(null);
    const timelineWrapperRef = useRef(null);
    const draggableInstance = useRef(null);

    const scale = 10; // pixels per million years
    const maxTime = 541; // Paleozoic start, our zero point on the timeline
    const totalWidth = maxTime * scale;

    const allSpecies = useMemo(() => {
        if (!faunaData) return [];
        return Object.values(faunaData).flatMap(subcategories =>
            subcategories.flatMap(sc => sc.species || [])
        );
    }, [faunaData]);

    const faunaWithTimeData = useMemo(() => allSpecies.map(dino => {
        if (dino.lived_from_ma === undefined || dino.lived_to_ma === undefined) {
            return null;
        }
        return dino;
    }).filter(Boolean), [allSpecies]);

    useEffect(() => {
        if (timelineWrapperRef.current && timelineContainerRef.current && !draggableInstance.current) {
            draggableInstance.current = Draggable.create(timelineWrapperRef.current, {
                type: 'x',
                edgeResistance: 0.65,
                bounds: timelineContainerRef.current,
                inertia: {
                    resistance: 300
                },
                allowNativeTouchScrolling: false,
            });
        }
        return () => {
            if (draggableInstance.current && draggableInstance.current[0]) {
                draggableInstance.current[0].kill();
                draggableInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (draggableInstance.current && draggableInstance.current[0]) {
            draggableInstance.current[0].enabled(!isCollapsed);
        }
    }, [isCollapsed]);

    useEffect(() => {
        const container = timelineContainerRef.current;
        if (!container || isCollapsed) {
            return;
        }

        const onWheel = (e) => {
            const draggable = draggableInstance.current && draggableInstance.current[0];
            if (!draggable) return;

            e.preventDefault();

            // Animate the draggable's x position for a smooth scroll effect.
            // Draggable will automatically respect the bounds.
            gsap.to(draggable, {
                x: draggable.x - e.deltaY * 1.2, // Adjust multiplier for sensitivity
                duration: 0.4,
                ease: "power2.out"
            });
        };

        container.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', onWheel);
        };
    }, [isCollapsed]);

    const renderTimeMarkers = () => {
        const markers = [];
        for (let i = 0; i <= maxTime; i += 50) {
            const position = (maxTime - i) * scale;
            markers.push(
                <div key={`marker-${i}`} className="time-marker" style={{ left: `${position}px` }}>
                    <span className="time-marker-label">{i} ma</span>
                </div>
            );
        }
        return markers;
    };

    return (
        <div className={`horizontal-timeline-container ${isCollapsed ? 'collapsed' : ''}`} ref={timelineContainerRef}>
            <button onClick={onToggle} className="timeline-toggle-button" title={isCollapsed ? 'Show timeline' : 'Hide timeline'}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 15L12 9L6 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            {!isCollapsed && filter && (
              <button onClick={onClearFilter} className="timeline-clear-filter-button">
                Clear Filter &times;
              </button>
            )}
            <div className="horizontal-timeline-wrapper" ref={timelineWrapperRef} style={{ width: `${totalWidth + 200}px` }}>
                <div className="time-ruler">{renderTimeMarkers()}</div>
                {Object.entries(timelineData).reverse().map(([eraName, eraData]) => {
                    const { start: eraStart, end: eraEnd } = parseDuration(eraData.duration);
                    const eraPosition = (maxTime - eraStart) * scale;
                    const eraWidth = (eraStart - eraEnd) * scale;
                    const isEraActive = filter && filter.type === 'era' && filter.value === `${eraName} Era`;

                    return (
                        <div key={eraName} className={`era-block ${eraName.toLowerCase()}`} style={{ left: `${eraPosition}px`, width: `${eraWidth}px` }}>
                            <h3
                              className={`era-title ${isEraActive ? 'active' : ''}`}
                              onClick={() => onFilterSelect({ type: 'era', value: `${eraName} Era` })}
                            >
                              {eraName}
                            </h3>
                            <div className="periods-container">
                                {Object.entries(eraData.periods).map(([periodName, periodData]) => {
                                    const { start: periodStart, end: periodEnd } = parseDuration(periodData.duration);
                                    const periodPosition = (eraStart - periodStart) * scale;
                                    const periodWidth = (periodStart - periodEnd) * scale;

                                    const faunaInPeriod = faunaWithTimeData.filter(dino => {
                                        // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
                                        // In our case: (dino.lived_to_ma <= periodStart) and (dino.lived_from_ma >= periodEnd)
                                        return dino.lived_to_ma <= periodStart && dino.lived_from_ma >= periodEnd;
                                    });

                                    return (
                                        <div key={periodName} className="period-block" style={{ left: `${periodPosition}px`, width: `${periodWidth}px` }}>
                                            <h4 className="period-title">{periodName}</h4>
                                            <div className="fauna-container">
                                                {faunaInPeriod.map((dino, index) => {
                                                    const dinoPosition = (periodStart - dino.lived_from_ma) * scale;
                                                    const dinoWidth = (dino.lived_from_ma - dino.lived_to_ma) * scale;
                                                    return (
                                                        <div
                                                            key={dino.name}
                                                            className="fauna-marker"
                                                            style={{ left: `${dinoPosition}px`, width: `${Math.max(dinoWidth, 5)}px`, bottom: `${25 + (index % 3) * 22}px` }}
                                                            title={`${dino.name} (${dino.lived_from_ma}-${dino.lived_to_ma} ma)`}
                                                            onClick={() => onFaunaClick && onFaunaClick(dino)}>
                                                            <div className="fauna-label">{dino.name}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="epochs-container">
                                                {periodData.epochs && Object.entries(periodData.epochs).map(([epochName, epochData]) => {
                                                    const { start: epochStart, end: epochEnd } = parseDuration(epochData.duration);
                                                    const epochPosition = (periodStart - epochStart) * scale;
                                                    const epochWidth = (epochStart - epochEnd) * scale;
                                                    return (
                                                        <div key={epochName} className="epoch-block" style={{ left: `${epochPosition}px`, width: `${epochWidth}px` }}>
                                                            <h5 className="epoch-title" title={`${epochName} (${epochData.duration})`}>{epochName}</h5>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HorizontalTimeline;
