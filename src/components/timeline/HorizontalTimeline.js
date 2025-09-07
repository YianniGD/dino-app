import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
    let processedStr = durationStr.replace(/ ma/g, '').replace(' to present', ' to 0').replace(' to today', ' to 0');
    if (processedStr.includes('ka')) {
        processedStr = processedStr.replace(/ ka/g, ' / 1000');
    }
    const parts = String(processedStr).split(' to ');
    const start = evaluate(parts[0]);
    const end = parts[1] ? evaluate(parts[1]) : start;
    return { start, end };
};

const createTimePeriodMap = (timelineData) => {
    const timePeriodMap = {};

    if (!timelineData) {
        return timePeriodMap;
    }

    for (const era of Object.values(timelineData)) {
        for (const [periodName, periodData] of Object.entries(era.periods)) {
            timePeriodMap[periodName] = parseDuration(periodData.duration);
            if (periodData.epochs) {
                for (const [epochName, epochData] of Object.entries(periodData.epochs)) {
                    // Mapping for "Late Cretaceous", "Early Jurassic", etc.
                    if (epochName === 'Upper') {
                        timePeriodMap[`Late ${periodName}`] = parseDuration(epochData.duration);
                    } else if (epochName === 'Lower') {
                        timePeriodMap[`Early ${periodName}`] = parseDuration(epochData.duration);
                    } else if (epochName === 'Middle') {
                        timePeriodMap[`Middle ${periodName}`] = parseDuration(epochData.duration);
                    }
                    timePeriodMap[epochName] = parseDuration(epochData.duration);
                }
            }
        }
    }

    // Manual mapping for Carboniferous
    if (timelineData.Paleozoic && timelineData.Paleozoic.periods.Carboniferous) {
        const carboniferous = timelineData.Paleozoic.periods.Carboniferous;
        if (carboniferous.epochs.Pennsylvanian) {
            timePeriodMap['Late Carboniferous'] = parseDuration(carboniferous.epochs.Pennsylvanian.duration);
        }
        if (carboniferous.epochs.Mississippian) {
            timePeriodMap['Early Carboniferous'] = parseDuration(carboniferous.epochs.Mississippian.duration);
        }
    }


    return timePeriodMap;
};

const formatEpochName = (epochName) => {
    switch (epochName) {
        case 'Upper':
            return 'Late';
        case 'Lower':
            return 'Early';
        default:
            return epochName;
    }
};


const HorizontalTimeline = ({ timelineData, faunaData, onFaunaClick, timelineState, onStateChange, filter, onFilterSelect, onClearFilter }) => {
    const timelineContainerRef = useRef(null);
    const timelineWrapperRef = useRef(null);
    const draggableInstance = useRef(null);
    const resizeHandleRef = useRef(null);
    const [selectedFauna, setSelectedFauna] = useState(null);

    // --- Internal State Management for Controlled/Uncontrolled Component ---
    // This allows the timeline to manage its own state if props aren't provided,
    // making it more robust and easier to use.
    const [internalState, setInternalState] = useState('collapsed');
    
    // A component is "controlled" when its state is managed by the parent via props.
    const isControlled = timelineState !== undefined;

    // Use the parent's state if controlled, otherwise use internal state.
    const currentState = isControlled ? timelineState : internalState;

    // This handler updates the state, whether it's internal or controlled by the parent.
    const handleStateChange = useCallback((newState) => {
        isControlled ? onStateChange?.(newState) : setInternalState(newState);
    }, [isControlled, onStateChange]);

    const scale = 20; // pixels per million years
    const maxTime = 541; // Paleozoic start, our zero point on the timeline
    const totalWidth = maxTime * scale;

    const timePeriodMap = useMemo(() => createTimePeriodMap(timelineData), [timelineData]);

    const allSpecies = useMemo(() => {
        if (!faunaData) return [];
        const uniqueSpecies = new Map();
        Object.values(faunaData).forEach(subcategories => {
            subcategories.forEach(sc => {
                if (sc.species) {
                    sc.species.forEach(s => {
                        // Create a more robust unique key
                        const uniqueKey = `${s.name}-${s.location}-${s.time_period}-${s.lived_from_ma || ''}-${s.lived_to_ma || ''}`;
                        if (!uniqueSpecies.has(uniqueKey)) {
                            uniqueSpecies.set(uniqueKey, s);
                        }
                    });
                }
            });
        });
        return Array.from(uniqueSpecies.values());
    }, [faunaData]);

    const faunaWithTimeData = useMemo(() => {
        const findBestMatchingPeriod = (dino, timelineData, timePeriodMap) => {
            const dinoStart = dino.lived_from_ma;
            const dinoEnd = dino.lived_to_ma;

            let bestMatch = null;
            let smallestDuration = Infinity;

            for (const era of Object.values(timelineData)) {
                for (const [periodName, periodData] of Object.entries(era.periods)) {
                    const periodRange = timePeriodMap[periodName];
                    if (periodRange && dinoStart <= periodRange.start && dinoEnd >= periodRange.end) {
                        const duration = periodRange.start - periodRange.end;
                        if (duration < smallestDuration) {
                            smallestDuration = duration;
                            bestMatch = periodName;
                        }
                    }

                    if (periodData.epochs) {
                        for (const [epochName, epochData] of Object.entries(periodData.epochs)) {
                            const fullEpochName = `${formatEpochName(epochName)} ${periodName}`; // e.g., "Late Cretaceous"
                            const epochRange = timePeriodMap[fullEpochName] || timePeriodMap[epochName]; // Try full name first, then just epoch name
                            
                            if (epochRange && dinoStart <= epochRange.start && dinoEnd >= epochRange.end) {
                                const duration = epochRange.start - epochRange.end;
                                if (duration < smallestDuration) {
                                    smallestDuration = duration;
                                    bestMatch = fullEpochName; // Store the full epoch name
                                }
                            }
                        }
                    }
                }
            }
            return bestMatch;
        };

        return allSpecies.map(dino => {
            let processedDino = { ...dino };

            if (dino.lived_from_ma === undefined || dino.lived_to_ma === undefined) {
                if (dino.time_period) {
                    const timePeriod = dino.time_period;
                    if (timePeriodMap[timePeriod]) {
                        const timeRange = timePeriodMap[timePeriod];
                        processedDino = { ...processedDino, lived_from_ma: timeRange.start, lived_to_ma: timeRange.end };
                    } else if (timePeriod.includes('-Present')) {
                        const startTimePeriod = timePeriod.replace('-Present', '');
                        if (timePeriodMap[startTimePeriod]) {
                            const timeRange = timePeriodMap[startTimePeriod];
                            processedDino = { ...processedDino, lived_from_ma: timeRange.start, lived_to_ma: 0 };
                        }
                    } else if (timePeriod.includes(' and ')) {
                        const parts = timePeriod.split(' and ');
                        const startPeriod = parts[0];
                        const endPeriod = parts[1];
                        if (timePeriodMap[startPeriod] && timePeriodMap[endPeriod]) {
                            const startRange = timePeriodMap[startPeriod];
                            const endRange = timePeriodMap[endPeriod];
                            processedDino = { ...processedDino, lived_from_ma: startRange.start, lived_to_ma: endRange.end };
                        }
                    }
                }
            }

            if (processedDino.lived_from_ma === undefined || processedDino.lived_to_ma === undefined) {
                return null; // Cannot determine time range, filter out
            }

            const renderPeriod = findBestMatchingPeriod(processedDino, timelineData, timePeriodMap);
            return { ...processedDino, renderPeriod };
        }).filter(Boolean);
    }, [allSpecies, timelineData, timePeriodMap]);

    useEffect(() => {
        if (timelineWrapperRef.current && timelineContainerRef.current && !draggableInstance.current) {
            draggableInstance.current = Draggable.create(timelineWrapperRef.current, {
                type: 'x',
                edgeResistance: 1,
                bounds: timelineContainerRef.current,
                inertia: false,
                allowNativeTouchScrolling: false,
                trigger: timelineWrapperRef.current,
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
            // Draggable should be enabled unless fully collapsed
            draggableInstance.current[0].enabled(currentState !== 'collapsed');
        }
    }, [currentState]);

    // Effect for the vertical resize handle
    useEffect(() => {
        const handle = resizeHandleRef.current;
        const container = timelineContainerRef.current;
        // Guard against missing elements
        if (!handle || !container) return;

        // If the component is controlled but a handler isn't provided, disable the handle.
        if (isControlled && typeof onStateChange !== 'function') {
            console.error("HorizontalTimeline: 'onStateChange' prop is missing or not a function for a controlled component. Drag-to-resize is disabled.");
            handle.style.cursor = 'not-allowed';
            return;
        }

        // Ensure handle is enabled
        handle.style.cursor = 'ns-resize';
        
        const handleMouseDown = (e) => {
            e.preventDefault();
            const startY = e.pageY;
            const startHeight = container.offsetHeight;

            // Disable transitions during drag for instant feedback
            container.style.transition = 'none';

            const handleMouseMove = (moveEvent) => {
                const newHeight = startHeight - (moveEvent.pageY - startY);
                container.style.height = `${newHeight}px`;
            };

            const handleMouseUp = () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);

                // Re-enable transitions for the snap animation
                container.style.transition = '';

                const finalHeight = container.offsetHeight;

                // Define state heights for snapping logic
                const expandedHeight = window.innerHeight * 0.6;
                const defaultHeight = 250;
                const collapsedHeight = 100;

                // Define snap thresholds as midpoints between the state heights
                const snapToExpandedThreshold = (expandedHeight + defaultHeight) / 2;
                const snapToCollapsedThreshold = (defaultHeight + collapsedHeight) / 2;

                // Remove inline height so CSS classes can take over for the animation
                container.style.height = '';

                if (finalHeight > snapToExpandedThreshold) {
                    handleStateChange('expanded');
                } else if (finalHeight < snapToCollapsedThreshold) {
                    handleStateChange('collapsed');
                } else {
                    handleStateChange('default');
                }
            };

            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        };

        handle.addEventListener('mousedown', handleMouseDown);

        // Cleanup function
        return () => {
            // Check if handle still exists before trying to remove listener
            if (handle) {
                handle.removeEventListener('mousedown', handleMouseDown);
            }
        };
    }, [isControlled, onStateChange, handleStateChange]); // Rerun this effect if handlers change

    useEffect(() => {
        const container = timelineContainerRef.current;
        const wrapper = timelineWrapperRef.current;
        const draggable = draggableInstance.current && draggableInstance.current[0];

        if (!container || !wrapper || !draggable || currentState === 'collapsed') {
            return;
        }

        const onWheel = (e) => {
            e.preventDefault();
            // Use deltaX for horizontal trackpad scroll, fallback to deltaY for mouse wheel
            const delta = e.deltaX || e.deltaY;
            // Calculate the new position, clamping it within the bounds defined by Draggable
            const newX = gsap.utils.clamp(draggable.minX, draggable.maxX, draggable.x - delta * 1.2);

            // Instantly set the new position using gsap.set for a 1:1 feel
            gsap.set(wrapper, { x: newX });

            // Force Draggable to update its internal values to match the element's new position
            draggable.update(true);
        };

        container.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', onWheel);
        };
    }, [currentState]);

    const renderTimeMarkers = () => {
        const markers = [];
        for (let i = 0; i <= maxTime; i += 10) {
            const position = (maxTime - i) * scale;
            const isMajorMarker = i % 50 === 0;
            markers.push(
                <div key={`marker-${i}`} className={`time-marker ${isMajorMarker ? '' : 'time-marker-minor'}`} style={{ left: `${position}px` }}>
                    {isMajorMarker && <span className="time-marker-label">{i} ma</span>}
                </div>
            );
        }
        return markers;
    };

    const handleEraClick = useCallback((eraName) => {
        const newFilter = { type: 'era', value: `${eraName} Era` };
        // Check if the clicked era is already the active filter
        if (filter && filter.type === newFilter.type && filter.value === newFilter.value) {
            onClearFilter?.(); // Use optional chaining for safety
        } else {
            onFilterSelect?.(newFilter); // Use optional chaining for safety
        }
    }, [filter, onClearFilter, onFilterSelect]);

    const handleToggle = useCallback(() => {
        // If it's open (default or expanded), collapse it. Otherwise, open to default.
        if (currentState !== 'collapsed') {
            handleStateChange('collapsed');
        } else {
            handleStateChange('default');
        }
    }, [currentState, handleStateChange]);

    const handleExpandToggle = useCallback(() => {
        // This button toggles between the default and expanded states.
        if (currentState === 'default') {
            handleStateChange('expanded');
        } else if (currentState === 'expanded') {
            handleStateChange('default');
        }
    }, [currentState, handleStateChange]);

    const getToggleTitle = useCallback(() => {
        if (currentState === 'collapsed') return 'Show timeline';
        return 'Hide timeline';
    }, [currentState]);

    return (
        <div className={`horizontal-timeline-container state-${currentState} ${filter ? 'filter-active' : ''}`} ref={timelineContainerRef}>
            <div ref={resizeHandleRef} className="timeline-resize-handle"></div>
            <button onClick={handleToggle} className="timeline-toggle-button" title={getToggleTitle()}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 15L12 9L6 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            <button onClick={handleExpandToggle} className="timeline-expand-button" title="Toggle full view">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            <button onClick={onClearFilter} className="timeline-clear-filter-button">
                Clear Filter &times;
            </button>
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
                              onClick={() => handleEraClick(eraName)}
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

                                    const layout = { lanes: [] }; // Each lane will be an array of placed markers

                                    const positionedFauna = faunaInPeriod.map(dino => {
                                        const dinoStart = (periodStart - dino.lived_from_ma) * scale;
                                        const dinoWidth = Math.max((dino.lived_from_ma - dino.lived_to_ma) * scale, 5);
                                        const dinoEnd = dinoStart + dinoWidth;

                                        let placed = false;
                                        for (let i = 0; i < layout.lanes.length; i++) {
                                            const lane = layout.lanes[i];
                                            const hasOverlap = lane.some(placedDino => {
                                                const buffer = 15; // 10px buffer
                                                return dinoStart < (placedDino.end + buffer) && dinoEnd > placedDino.start;
                                            });

                                            if (!hasOverlap) {
                                                lane.push({ start: dinoStart, end: dinoEnd });
                                                dino.lane = i;
                                                placed = true;
                                                break;
                                            }
                                        }

                                        if (!placed) {
                                            layout.lanes.push([{ start: dinoStart, end: dinoEnd }]);
                                            dino.lane = layout.lanes.length - 1;
                                        }

                                        return dino;
                                    });

                                    const maxLane = positionedFauna.reduce((max, dino) => Math.max(max, dino.lane), -1);
                                    const requiredFaunaHeight = (maxLane + 1) * 30 + 25; // 30px per lane, 25px bottom offset

                                    return (
                                        <div key={periodName} className="period-block" style={{ left: `${periodPosition}px`, width: `${periodWidth}px`, minHeight: `${requiredFaunaHeight}px` }}>
                                            <h4 className="period-title">{periodName}</h4>
                                            <div className="fauna-container">
                                                {positionedFauna.map((dino, index) => {
                                                    const dinoPosition = (periodStart - dino.lived_from_ma) * scale;
                                                    const dinoWidth = (dino.lived_from_ma - dino.lived_to_ma) * scale;
                                                    return (
                                                        <div
                                                            key={dino.name}
                                                            className="fauna-marker"
                                                            style={{ left: `${dinoPosition}px`, width: `${Math.max(dinoWidth, 5)}px`, bottom: `${25 + dino.lane * 30}px` }}
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
                                                    const formatEpochName = (epochName) => {
                                                        switch (epochName) {
                                                            case 'Upper':
                                                                return 'Late';
                                                            case 'Lower':
                                                                return 'Early';
                                                            default:
                                                                return epochName;
                                                        }
                                                    };
                                                    return (
                                                        <div key={epochName} className="epoch-block" style={{ left: `${epochPosition}px`, width: `${epochWidth}px` }}>
                                                            <h5 className="epoch-title" title={`${formatEpochName(epochName)} (${epochData.duration})`}>{formatEpochName(epochName)}</h5>
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
