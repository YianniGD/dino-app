const getAllSpecies = (data) => {
  return Object.values(data).flat().flatMap(subcategory => subcategory.species);
};

export const groupByTimePeriod = (data) => {
  const groups = {};
  const allSpecies = getAllSpecies(data);

  allSpecies.forEach(species => {
    // Group by the main time period only (e.g., "Cretaceous")
    const key = species.time_period;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(species);
  });
  return groups;
};

export const groupByLocation = (data) => {
  const groups = {};
  const allSpecies = getAllSpecies(data);

  allSpecies.forEach(species => {
    const key = species.location;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(species);
  });
  return groups;
};