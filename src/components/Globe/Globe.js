import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Globe from 'react-globe.gl';
import { getCoordinates } from '../../utils/geocoder';
import data from '../../fauna.json';
import { timeHierarchy } from '../../utils/timeHierarchy';
import { haversineDistance } from '../../utils/haversine';
import './Globe.css';

const desiredTexture = process.env.PUBLIC_URL + '/earth-day.jpg';
const bumpMapTexture = process.env.PUBLIC_URL + '/earth-topology.jpg';

const World = ({ onPointClick, onBackgroundClick, isOverlayOpen, isRotationEnabled, filter, selectedPoint }) => {
  const globeEl = useRef();
  const [markers, setMarkers] = useState([]);
  const rotationTimeout = useRef();
  const markerElements = useRef(new Map());
  const globeTexture = desiredTexture;

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
          const iconUrl = `/dinosvg/${species.image}`;
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

  const handleGlobeClick = useCallback(({ lat, lng }) => {
    // Pause rotation on any click on the globe surface
    const controls = globeEl.current?.controls();
    if (controls) {
      controls.autoRotate = false;
      clearTimeout(rotationTimeout.current);
    }

    // Find the closest marker to the clicked point
    let closestMarker = null;
    let minDistance = Infinity;
    const clickThreshold = 50; // kilometers, adjust as needed

    markers.forEach(marker => {
      const distance = haversineDistance(lat, lng, marker.lat, marker.lng);
      if (distance < minDistance && distance < clickThreshold) {
        minDistance = distance;
        closestMarker = marker;
      }
    });

    if (closestMarker) {
      console.log('Closest marker clicked:', closestMarker.name);
      onPointClick(closestMarker);
      // globeEl.current.pointOfView({ lat: closestMarker.originalLat || closestMarker.lat, lng: closestMarker.originalLng || closestMarker.lng, altitude: 1.5 }, 1000);
    } else {
      // If no marker was clicked, clear selected point
      onBackgroundClick();
    }
  }, [markers, onPointClick, onBackgroundClick]);

  const handleGlobeHover = useCallback(({ lat, lng }) => {
    // Find the closest marker to the hovered point
    let hoveredMarker = null;
    let minDistance = Infinity;
    const hoverThreshold = 50; // kilometers, adjust as needed

    markers.forEach(marker => {
      const distance = haversineDistance(lat, lng, marker.lat, marker.lng);
      if (distance < minDistance && distance < hoverThreshold) {
        minDistance = distance;
        hoveredMarker = marker;
      }
    });

    // Pause rotation on hover over any marker
    const controls = globeEl.current?.controls();
    if (controls) {
      if (hoveredMarker) {
        controls.autoRotate = false;
      } else if (isRotationEnabled && !isOverlayOpen) {
        // Resume rotation only if no marker is hovered and rotation is enabled and overlay is closed
        controls.autoRotate = true;
      }
    }

    // You can add visual feedback for hover here if needed, e.g., set a hoveredPoint state
    // For now, just logging
    if (hoveredMarker) {
      // console.log('Hovered over marker:', hoveredMarker.name);
    }
  }, [markers, isRotationEnabled, isOverlayOpen]);

    const htmlElement = useCallback(d => {
    const el = document.createElement('div');
    el.className = 'marker-container'; // Add a class for styling

    // Icon
    const icon = document.createElement('img');
    icon.src = process.env.PUBLIC_URL + d.iconUrl; // Use PUBLIC_URL for icon path
    icon.className = 'marker-icon';
    el.appendChild(icon);

    // Species Name
    const name = document.createElement('div');
    name.className = 'marker-name';
    name.textContent = d.name;
    el.appendChild(name);

    return el;
  }, []);

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
        onGlobeHover={handleGlobeHover}
        backgroundImageUrl={process.env.PUBLIC_URL + '/starfield.jpg'}
      />
    </div>
  );
};

export default memo(World);