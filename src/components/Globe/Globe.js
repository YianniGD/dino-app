import React, { useState, useEffect, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { getCoordinates } from '../../utils/geocoder';
import data from '../../fauna.json';
import { timeHierarchy } from '../../utils/timeHierarchy';
import './Globe.css';

const fallbackTexture = '//unpkg.com/three-globe/example/img/earth-day.jpg';
const desiredTexture = '/earth-night.png';
const bumpMapTexture = '//unpkg.com/three-globe/example/img/earth-topology.png';

const World = ({ onPointClick, isOverlayOpen, isRotationEnabled, filter }) => {
  const globeEl = useRef();
  const [markers, setMarkers] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const rotationTimeout = useRef();
  const markerElements = useRef(new Map());
  const [globeTexture, setGlobeTexture] = useState(fallbackTexture);

  // Effect to load the desired texture, with a fallback if it fails.
  useEffect(() => {
    const img = new Image();
    img.src = desiredTexture;
    img.onload = () => {
      // The image loaded successfully, so we can use it.
      setGlobeTexture(desiredTexture);
    };
    img.onerror = () => {
      // The image failed to load, stick with the fallback and warn the user.
      console.warn(`Could not load local globe texture at "${desiredTexture}". Please ensure the file exists in the 'public' directory. The fallback texture will be used.`);
    };
  }, []); // Run only once on mount

  // Effect to clear selected point when overlay is closed, providing better UX
  useEffect(() => {
    if (!isOverlayOpen) {
      setSelectedPoint(null);
    }
  }, [isOverlayOpen]);

  // Effect to control globe auto-rotation based on user interaction and overlay state
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
    if (globeEl.current) {
      globeEl.current.controls().autoRotateSpeed = 0.2;
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
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

    let markerData = filteredSpecies
      .map((species) => {
        const coords = getCoordinates(species);
        if (coords) {
          // Assign a random icon to each species since there is no specific mapping.
          const randomNumber = Math.floor(Math.random() * 161) + 1;
          const iconUrl = `/dinosvg/Asset%20${randomNumber}.svg`;
          return { ...coords, ...species, iconUrl };
        }
        return null;
      })
      .filter(Boolean);

    // --- Jittering logic to prevent overlapping points ---
    const pointsByLocation = new Map();
    markerData.forEach(marker => {
      // Group points by location, using fixed precision for floating point keys
      const key = `${marker.lat.toFixed(4)},${marker.lng.toFixed(4)}`;
      if (!pointsByLocation.has(key)) {
        pointsByLocation.set(key, []);
      }
      pointsByLocation.get(key).push(marker);
    });

    const jitteredMarkers = [];
    const JITTER_RADIUS_DEGREES = 2.5; // Increased radius for better visual separation

    pointsByLocation.forEach(group => {
      if (group.length > 1) {
        const n = group.length;
        const centerLat = group[0].lat;
        const centerLng = group[0].lng;

        group.forEach((marker, i) => {
          const angle = (2 * Math.PI * i) / n;
          // Adjust longitude radius based on latitude to prevent distortion near poles
          const lngRadius = JITTER_RADIUS_DEGREES / Math.cos(centerLat * (Math.PI / 180));
          const newLat = centerLat + JITTER_RADIUS_DEGREES * Math.sin(angle);
          const newLng = centerLng + lngRadius * Math.cos(angle);

          jitteredMarkers.push({
            ...marker,
            lat: newLat,
            lng: newLng,
            originalLat: centerLat, // Store original location for centering the view
            originalLng: centerLng,
          });
        });
      } else {
        jitteredMarkers.push(group[0]);
      }
    });

    setMarkers(jitteredMarkers);
  }, [filter]);

  // When the filter changes and new markers are generated, clear our element map
  useEffect(() => {
    markerElements.current.clear();
  }, [markers]);

  // Imperatively update the 'selected' class on markers when selectedPoint changes
  useEffect(() => {
    // Clear class from all markers
    markerElements.current.forEach(el => el.classList.remove('selected'));

    // Add class to the currently selected one
    if (selectedPoint && markerElements.current.has(selectedPoint)) {
      const el = markerElements.current.get(selectedPoint);
      el.classList.add('selected');
    }
  }, [selectedPoint]);

  const handleGlobeClick = () => {
    // Pause rotation on any click on the globe surface
    const controls = globeEl.current?.controls();
    if (controls) {
      controls.autoRotate = false;
      clearTimeout(rotationTimeout.current);
    }
  };

  const handlePointClick = useCallback((point) => {
    console.log('Point clicked in Globe.js:', point);
    // Center view on the original location, especially for jittered points
    const { lat, lng } = point.originalLat ? { lat: point.originalLat, lng: point.originalLng } : point;
    globeEl.current.pointOfView({ lat, lng, altitude: 2.5 }, 1000); // Faster 500ms animation

    // Set selected state for visual feedback and propagate to parent
    setSelectedPoint(point);
    onPointClick(point);
  }, [onPointClick]);

  const htmlElement = useCallback(d => {
    const el = document.createElement('div');
    el.style.width = '10px';
    el.style.height = '10px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = 'blue';
    el.style.cursor = 'pointer';
    el.onclick = () => handlePointClick(d);
    return el;
  }, [handlePointClick]);

  return (
    <div className="globe-container">
      <Globe
        ref={globeEl}
        globeImageUrl={globeTexture}
        bumpImageUrl={bumpMapTexture}
        htmlTransitionDuration={0}
        globeOffset={[0, 0]}
        htmlElementsData={markers}
        htmlLat="lat"
        htmlLng="lng"
        htmlElement={htmlElement}
        onGlobeClick={handleGlobeClick}
      />
    </div>
  );
};

export default World;
