import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { getCoordinates } from '../../utils/geocoder';
import data from '../../fauna.json';
import { timeHierarchy } from '../../utils/timeHierarchy';
import './Globe.css';

const World = ({ onPointClick, isOverlayOpen, isRotationEnabled, filter }) => {
  const globeEl = useRef();
  const [markers, setMarkers] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const rotationTimeout = useRef();

  // Effect to control globe auto-rotation based on user interaction
  useEffect(() => {
    const controls = globeEl.current?.controls();
    if (!controls) return;

    clearTimeout(rotationTimeout.current);

    if (!isRotationEnabled) {
      // Globally disabled, so ensure rotation is off.
      controls.autoRotate = false;
      return;
    }

    if (isOverlayOpen) {
      // Overlay is open, so stop rotation.
      controls.autoRotate = false;
    } else {
      // Globally enabled and no overlay, so resume rotation after a delay.
      rotationTimeout.current = setTimeout(() => {
        if (globeEl.current) {
          globeEl.current.controls().autoRotate = true;
        }
      }, 3000);
    }

    // Cleanup timeout on unmount or when isOverlayOpen changes
    return () => clearTimeout(rotationTimeout.current);
  }, [isOverlayOpen, isRotationEnabled]);

  useEffect(() => {
    // This effect runs only once to set up initial globe properties
    if (globeEl.current) {
      globeEl.current.controls().autoRotateSpeed = 0.2;
    }
  }, []);

  useEffect(() => {
    // --- Process data for markers ---
    // This effect re-runs whenever the filter changes
    const allSpecies = Object.entries(data).flatMap(([categoryName, subcategories]) =>
      subcategories.flatMap(sc =>
        sc.species.map(s => ({ ...s, parentCategory: categoryName }))
      )
    );

    // Pre-filter species to only include those from Paleozoic, Mesozoic, and Cenozoic eras.
    const erasToShow = ['Paleozoic Era', 'Mesozoic Era', 'Cenozoic Era'];
    const allAllowedPeriods = erasToShow.flatMap(eraName => {
      const era = timeHierarchy[eraName];
      if (!era) return [];
      // era is now an object of periods, like { Cretaceous: [...], Jurassic: [...] }
      return Object.values(era).flat();
    });

    const speciesInMajorEras = allSpecies.filter(species => {
      // Handle species that span multiple periods, e.g., "Late Jurassic-Early Cretaceous"
      const speciesPeriods = species.time_period.split(/-| to /).map(p => p.trim());
      return speciesPeriods.some(p => allAllowedPeriods.includes(p));
    });

    let filteredSpecies = speciesInMajorEras;
    if (filter) {
      // Apply the user's filter on top of the pre-filtered data
      filteredSpecies = speciesInMajorEras.filter(species => {
        // Handle species that might span multiple periods, e.g., "Late Jurassic-Early Cretaceous"
        const speciesPeriods = species.time_period.split(/-| to /).map(p => p.trim());

        switch (filter.type) {
          case 'era': {
            const eraData = timeHierarchy[filter.value];
            if (!eraData) return false;
            const periodsInEra = Object.values(eraData).flat();
            return speciesPeriods.some(p => periodsInEra.includes(p));
          }
          case 'time_period': {
            const filterValue = filter.value;
            let periodsToMatch = [filterValue];

            // Check if the filter is a major period (e.g., "Cretaceous") and expand it to its sub-periods
            for (const eraName in timeHierarchy) {
              const era = timeHierarchy[eraName];
              if (era[filterValue]) {
                periodsToMatch = era[filterValue];
                break;
              }
            }
            return speciesPeriods.some(p => periodsToMatch.includes(p));
          }
          case 'location':
            return species.location === filter.value;
          case 'type':
            return species.parentCategory === filter.value;
          default:
            return true;
        }
      });
    }

    const markerData = filteredSpecies
      .map((species) => {
        const coords = getCoordinates(species.location);
        if (coords) {
          // Pass the entire species object as the marker data
          return { ...coords, ...species };
        }
        return null;
      })
      .filter(Boolean);

    console.log(`Generated ${markerData.length} markers for filter:`, filter);
    setMarkers(markerData);
  }, [filter]);

  const handleGlobeClick = () => {
    // Pause rotation on any click on the globe surface
    const controls = globeEl.current?.controls();
    if (controls) {
      controls.autoRotate = false;
      clearTimeout(rotationTimeout.current);
    }
  };

  return (
    <div className="globe-container">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
        pointsData={markers}
        pointLat="lat"
        pointLng="lng"
        pointLabel="name"
        pointRadius={p => (p === hoveredPoint ? 0.75 : 0.5)}
        pointColor={p => (p === hoveredPoint ? 'rgba(173, 216, 230, 1)' : 'rgba(245, 245, 245, 0.75)')}
        pointAltitude={0}
        onPointClick={onPointClick}
        onGlobeClick={handleGlobeClick}
        onPointHover={setHoveredPoint}
      />
    </div>
  );
};

export default World;
