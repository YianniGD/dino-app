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
    let processedStr = durationStr.replace(' ma', '').replace(' to present', ' to 0').replace(' to today', ' to 0');
    if (processedStr.includes('ka')) {
        processedStr = processedStr.replace(' ka', ' / 1000');
    }
    const parts = String(processedStr).split(' to ');
    const start = evaluate(parts[0]);
    const end = parts[1] ? evaluate(parts[1]) : start;
    return { start, end };
};


const HorizontalTimeline = ({ timelineData, faunaData, onFaunaClick, timelineState, onStateChange, filter, onFilterSelect, onClearFilter }) => {
    const timelineContainerRef = useRef(null);
    const timelineWrapperRef = useRef(null);
    const draggableInstance = useRef(null);
    const resizeHandleRef = useRef(null);

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
