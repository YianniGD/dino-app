// To build a comprehensive hierarchy, one would need to programmatically extract all unique 
// `time_period` values from `fauna.json`. Since I don't have access to the file content, 
// I've created a representative structure that includes the "Early", "Middle", and "Late" 
// signifiers you mentioned. This structure allows for more granular filtering.
// You may need to adjust this based on the actual values in your data.
export const timeHierarchy = {
  "Paleozoic Era": {
    "Permian": ["Permian", "Early Permian", "Late Permian"],
    "Carboniferous": ["Carboniferous"],
    "Devonian": ["Devonian"],
    "Silurian": ["Silurian"],
    "Ordovician": ["Ordovician"],
  },
  "Mesozoic Era": {
    "Cretaceous": ["Cretaceous", "Early Cretaceous", "Late Cretaceous"],
    "Jurassic": ["Jurassic", "Early Jurassic", "Middle Jurassic", "Late Jurassic"],
    "Triassic": ["Triassic", "Early Triassic", "Middle Triassic", "Late Triassic"],
  },
  "Cenozoic Era": {
    "Pleistocene": ["Pleistocene"],
    "Pliocene": ["Pliocene"],
    "Miocene": ["Miocene"],
    "Eocene": ["Eocene"],
    "Paleocene": ["Paleocene"],
  },
};

export const eras = Object.keys(timeHierarchy);