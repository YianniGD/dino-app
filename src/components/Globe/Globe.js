import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { getCoordinates } from '../../utils/geocoder';
import data from '../../fauna.json';
import { timeHierarchy } from '../../utils/timeHierarchy';
import './Globe.css';

// --- Dynamic Globe Textures ---
// To use dynamic textures, place your image files in the `public/textures/` directory.
// The keys should match the 'value' from your filter options (e.g., 'Mesozoic Era', 'Cretaceous').
const eraTextureMap = {
  'Paleozoic Era': '/textures/paleozoic_era.jpg', // ~250 Ma
  'Mesozoic Era': '/textures/mesozoic_era.jpg',   // ~150 Ma
  'Cenozoic Era': '/textures/cenozoic_era.jpg',   // ~50 Ma
};
const defaultTexture = '//unpkg.com/three-globe/example/img/earth-day.jpg';

const World = ({ onPointClick, isOverlayOpen, isRotationEnabled, filter }) => {
  const globeEl = useRef();
  const [markers, setMarkers] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const rotationTimeout = useRef();
  const [globeImageUrl, setGlobeImageUrl] = useState(defaultTexture);

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
    // This effect runs only once to set up initial globe properties
    if (globeEl.current) {
      globeEl.current.controls().autoRotateSpeed = 0.2;
      // Set initial camera position to ensure the globe is visible on load
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    }
  }, []);

  useEffect(() => {
    // --- Texture update logic based on filter ---
    let newTextureUrl = defaultTexture;
    if (filter) {
      let key = filter.value;
      // For time periods, we want to find the major period (e.g., "Cretaceous")
      // to match a texture, even if the filter is for a sub-period (e.g., "Late Cretaceous").
      if (filter.type === 'time_period') {
        for (const eraName in timeHierarchy) {
          const era = timeHierarchy[eraName];
          for (const periodName in era) {
            if (era[periodName].includes(filter.value)) {
              key = periodName; // Use the major period name (e.g., "Cretaceous") as the key
              break;
            }
          }
        }
      }

      // Check for a matching texture if the filter is time-based
      if (filter.type === 'era' || filter.type === 'time_period') {
        newTextureUrl = eraTextureMap[key] || defaultTexture;
      }
    }

    if (globeEl.current && newTextureUrl !== globeImageUrl) {
      // Fast spin to hide the texture swap
      const controls = globeEl.current.controls();
      const originalSpeed = controls.autoRotateSpeed;
      controls.autoRotateSpeed = 10; // A much faster spin

      setTimeout(() => {
        setGlobeImageUrl(newTextureUrl);
        if (globeEl.current) {
          // Restore speed after the texture has been set
          globeEl.current.controls().autoRotateSpeed = originalSpeed;
        }
      }, 500); // Spin for 0.5 seconds before swapping the image
    }

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
          // Add a placeholder icon URL based on the category.
          // You can create corresponding SVG files in `public/icons/`.
          const category = species.parentCategory;
          // Make category name singular for the icon file (e.g., "fishes" -> "fish")
          const iconName = category.endsWith('s') ? category.slice(0, -1) : category;
          const iconUrl = `/icons/${iconName}.svg`;
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

    console.log(`Generated ${jitteredMarkers.length} markers for filter:`, filter);
    setMarkers(jitteredMarkers);
  }, [filter, globeImageUrl]);

  const handleGlobeClick = () => {
    // Pause rotation on any click on the globe surface
    const controls = globeEl.current?.controls();
    if (controls) {
      controls.autoRotate = false;
      clearTimeout(rotationTimeout.current);
    }
  };

  const handlePointClick = (point) => {
    // Center view on the original location, especially for jittered points
    const { lat, lng } = point.originalLat ? { lat: point.originalLat, lng: point.originalLng } : point;
    globeEl.current.pointOfView({ lat, lng, altitude: 1.5 }, 1000);

    // Set selected state for visual feedback and propagate to parent
    setSelectedPoint(point);
    onPointClick(point);
  };

  return (
    <div className="globe-container">
      <Globe
        ref={globeEl}
        globeImageUrl={globeImageUrl}
        globeOffset={[-150, 0]}
        htmlElementsData={markers}
        htmlLat="lat"
        htmlLng="lng"
        htmlElement={d => {
          const el = document.createElement('div');
          el.innerHTML = `<img src="${d.iconUrl}" title="${d.name}" class="globe-marker-icon" />`;
          el.className = 'globe-marker';

          if (d === selectedPoint) {
            el.classList.add('selected');
          }
          if (d === hoveredPoint) {
            el.classList.add('hovered');
          }

          el.style.pointerEvents = 'auto';
          el.style.cursor = 'pointer';
          el.onclick = () => handlePointClick(d);
          el.onmouseenter = () => setHoveredPoint(d);
          el.onmouseleave = () => setHoveredPoint(null);
          return el;
        }}
        onGlobeClick={handleGlobeClick}
      />
    </div>
  );
};

export default World;
