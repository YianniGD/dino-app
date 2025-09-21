
const locationCoordinates = {
  "Spitzbergen": { lat: 78.22, lng: 15.65 },
  "Australia": { lat: -25.27, lng: 133.77 },
  "Scotland": { lat: 56.49, lng: -4.20 },
  "Germany": { lat: 51.16, lng: 10.45 },
  "Europe": { lat: 54.52, lng: 15.25 },
  "Norway": { lat: 60.47, lng: 8.46 },
  "Worldwide": { lat: 0, lng: 0 }, // Or handle this case separately
  "North America": { lat: 54.52, lng: -105.25 },
  "Europe and North America": { lat: 54.52, lng: -45.00 },
  "South America and Africa": { lat: -8.78, lng: -34.50 },
  "South Africa and eastern Europe": { lat: 25.27, lng: 23.77 },
  "Russia": { lat: 61.52, lng: 105.31 },
  "India": { lat: 20.59, lng: 78.96 },
  "Australia and Lord Howe Island": { lat: -28.99, lng: 145.86 },
  "Madagascar": { lat: -18.76, lng: 46.86 },
  "Argentina": { lat: -38.41, lng: -63.61 },
  "Asia": { lat: 34.04, lng: 100.61 },
  "Greenland": { lat: 71.70, lng: -42.60 },
  "Africa": { lat: -8.78, lng: 34.50 },
  "Italy": { lat: 41.87, lng: 12.56 },
  "Kazakhstan": { lat: 48.01, lng: 66.92 },
  "China": { lat: 35.86, lng: 104.19 },
  "Brazil": { lat: -14.23, lng: -51.92 },
  "Middle East": { lat: 29.29, lng: 42.55 },
  "Spitsbergen": { lat: 78.22, lng: 15.65 },
  "Europe and Asia": { lat: 45.00, lng: 60.00 },
  "North America and Europe": { lat: 54.52, lng: -45.00 },
  "South America": { lat: -8.78, lng: -55.49 },
  "Lord Howe Island": { lat: -31.55, lng: 159.08 },
  "eastern Europe": { lat: 47.00, lng: 32.00 },
  "South Africa": { lat: -30.55, lng: 22.93 },
  "UK": { lat: 54.00, lng: -2.00 },
  "USA": { lat: 38.00, lng: -97.00 },
};

export const getCoordinates = (item) => {
    // Handle items with direct lat/lng (from Locations.json)
    if (typeof item.lat === 'number' && typeof item.lng === 'number') {
        return { lat: item.lat, lng: item.lng };
    }

    // Handle items with a 'coordinates' object (from fauna.json)
    if (item.coordinates && typeof item.coordinates.lat === 'number' && typeof item.coordinates.lng === 'number') {
        return item.coordinates;
    }

    // Fallback to legacy location string lookup.
    const location = item.location;
    if (!location) return null;

    // Handle cases with multiple locations
    if (location.includes(' and ')) {
        const locations = location.split(' and ');
        const coords = locations.map(l => locationCoordinates[l.trim()]).filter(Boolean);
        if (coords.length > 0) {
            // Return the average coordinates
            const avgLat = coords.reduce((sum, coord) => sum + coord.lat, 0) / coords.length;
            const avgLng = coords.reduce((sum, coord) => sum + coord.lng, 0) / coords.length;
            return { lat: avgLat, lng: avgLng };
        }
    }
    return locationCoordinates[location];
};
