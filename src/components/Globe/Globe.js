import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import lottie from 'lottie-web';
import { getCoordinates } from '../../utils/geocoder';
import data from '../../fauna.json';
import locationsData from '../../Locations.json';
import { timeHierarchy } from '../../utils/timeHierarchy';
import { haversineDistance } from '../../utils/haversine';
import './Globe.css';

const World = ({ onPointClick, onBackgroundClick, isOverlayOpen, isRotationEnabled, filter, selectedPoint }) => {
  const globeEl = useRef();
  const [markers, setMarkers] = useState([]);
  const [globeMaterial, setGlobeMaterial] = useState(new THREE.MeshPhongMaterial());
  const rotationTimeout = useRef();
  const markerElements = useRef(new Map());

  useEffect(() => {
    // Setup globe material
    const material = new THREE.MeshPhongMaterial();
    const textureLoader = new THREE.TextureLoader();

    const colorTextureUrl = process.env.PUBLIC_URL + '/earth-day.jpg';

    // Load color texture
    textureLoader.load(colorTextureUrl, texture => {
      material.map = texture;
      material.needsUpdate = true;
    });
    

    setGlobeMaterial(material);
  }, []);

  // Effect to control globe auto-rotation
  useEffect(() => {
    const controls = globeEl.current?.controls();
    if (!controls) return;

    clearTimeout(rotationTimeout.current);

    if (!isRotationEnabled) {
      controls.autoRotate = false;
      return;
    }

    if (isOverlayOpen) {
      controls.autoRotate = false;
    } else {
      rotationTimeout.current = setTimeout(() => {
        if (globeEl.current) {
          globeEl.current.controls().autoRotate = true;
        }
      }, 3000);
    }

    return () => clearTimeout(rotationTimeout.current);
  }, [isOverlayOpen, isRotationEnabled]);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotateSpeed = 0.2;
      globeEl.current.pointOfView({ lat: 45, lng: -100, altitude: 2.5 }, 1000);
    }
  }, []);

  useEffect(() => {
    // Process fauna data
    const allSpecies = Object.entries(data).flatMap(([categoryName, subcategories]) =>
      subcategories.flatMap(sc =>
        sc.species.map(s => ({ ...s, parentCategory: categoryName, dataType: 'fauna', useLottie: sc.subcategory_name === 'Large Carnivores' }))
      )
    );

    const erasToShow = ['Paleozoic Era', 'Mesozoic Era', 'Cenozoic Era'];
    const allAllowedPeriods = erasToShow.flatMap(eraName => {
      const era = timeHierarchy[eraName];
      if (!era) return [];
      return Object.values(era).flat();
    });

    const speciesInMajorEras = allSpecies.filter(species => {
      const speciesPeriods = species.time_period.split(/-| to /).map(p => p.trim());
      return speciesPeriods.some(p => allAllowedPeriods.includes(p));
    });

    let filteredSpecies = speciesInMajorEras;
    if (filter) {
      filteredSpecies = speciesInMajorEras.filter(species => {
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

    const locationMarkers = locationsData.map(loc => ({ ...loc, dataType: 'location' }));
    const allData = [...filteredSpecies, ...locationMarkers];

    let markerData = allData
      .map((item) => {
        const coords = getCoordinates(item);
        if (coords) {
          const iconUrl = item.dataType === 'location' 
            ? '/dinosvg/Digsite.svg' 
            : `/dinosvg/${item.image}`;
          return { ...coords, ...item, iconUrl };
        }
        return null;
      })
      .filter(Boolean);

    const pointsByLocation = new Map();
    markerData.forEach(marker => {
      const key = `${marker.lat.toFixed(4)},${marker.lng.toFixed(4)}`;
      if (!pointsByLocation.has(key)) {
        pointsByLocation.set(key, []);
      }
      pointsByLocation.get(key).push(marker);
    });

    const jitteredMarkers = [];
    const JITTER_RADIUS_DEGREES = 2.5;

    pointsByLocation.forEach(group => {
      if (group.length > 1) {
        const n = group.length;
        const centerLat = group[0].lat;
        const centerLng = group[0].lng;

        group.forEach((marker, i) => {
          const angle = (2 * Math.PI * i) / n;
          const lngRadius = JITTER_RADIUS_DEGREES / Math.cos(centerLat * (Math.PI / 180));
          const newLat = centerLat + JITTER_RADIUS_DEGREES * Math.sin(angle);
          const newLng = centerLng + lngRadius * Math.cos(angle);

          jitteredMarkers.push({
            ...marker,
            lat: newLat,
            lng: newLng,
            originalLat: centerLat,
            originalLng: centerLng,
          });
        });
      } else {
        jitteredMarkers.push(group[0]);
      }
    });

    setMarkers(jitteredMarkers);
  }, [filter]);

  useEffect(() => {
    markerElements.current.clear();
  }, [markers]);

  useEffect(() => {
    markerElements.current.forEach(el => el.classList.remove('selected'));
    if (selectedPoint && markerElements.current.has(selectedPoint)) {
      const el = markerElements.current.get(selectedPoint);
      el.classList.add('selected');
    }
  }, [selectedPoint]);

  const handleGlobeClick = useCallback(({ lat, lng }) => {
    const controls = globeEl.current?.controls();
    if (controls) {
      controls.autoRotate = false;
      clearTimeout(rotationTimeout.current);
    }

    let closestMarker = null;
    let minDistance = Infinity;
    const clickThreshold = 50;

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
    } else {
      onBackgroundClick();
    }
  }, [markers, onPointClick, onBackgroundClick]);

  const handleGlobeHover = useCallback(({ lat, lng }) => {
    let hoveredMarker = null;
    let minDistance = Infinity;
    const hoverThreshold = 50;

    markers.forEach(marker => {
      const distance = haversineDistance(lat, lng, marker.lat, marker.lng);
      if (distance < minDistance && distance < hoverThreshold) {
        minDistance = distance;
        hoveredMarker = marker;
      }
    });

    const controls = globeEl.current?.controls();
    if (controls) {
      if (hoveredMarker) {
        controls.autoRotate = false;
      } else if (isRotationEnabled && !isOverlayOpen) {
        controls.autoRotate = true;
      }
    }

    if (hoveredMarker) {
    }
  }, [markers, isRotationEnabled, isOverlayOpen]);

    const htmlElement = useCallback(d => {
    const el = document.createElement('div');
    el.className = 'marker-container';

    if (d.useLottie) {
        el.style.width = '50px';
        el.style.height = '50px';
        lottie.loadAnimation({
            container: el,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: process.env.PUBLIC_URL + '/loading.json'
        });
    } else {
        const icon = document.createElement('img');
        icon.src = process.env.PUBLIC_URL + d.iconUrl;
        icon.className = 'marker-icon';
        el.appendChild(icon);
    }

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
        globeMaterial={globeMaterial}
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
