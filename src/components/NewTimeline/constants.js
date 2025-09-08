// Fix: Export constants to be used across the application.
export const GEOLOGIC_PERIODS = [{
  name: 'Cretaceous',
  start: 145,
  end: 66,
  color: 'bg-green-500/10'
}, {
  name: 'Jurassic',
  start: 201,
  end: 145,
  color: 'bg-blue-500/10'
}, {
  name: 'Triassic',
  start: 252,
  end: 201,
  color: 'bg-purple-500/10'
}, {
  name: 'Permian',
  start: 299,
  end: 252,
  color: 'bg-red-500/10'
}, {
  name: 'Carboniferous',
  start: 359,
  end: 299,
  color: 'bg-orange-500/10'
}, {
  name: 'Devonian',
  start: 419,
  end: 359,
  color: 'bg-yellow-500/10'
}, {
  name: 'Silurian',
  start: 444,
  end: 419,
  color: 'bg-teal-500/10'
}, {
  name: 'Ordovician',
  start: 485,
  end: 444,
  color: 'bg-indigo-500/10'
}];
export const TIMELINE_START_MA = 500;
export const TIMELINE_END_MA = 0;
export const TIMELINE_SPAN = TIMELINE_START_MA - TIMELINE_END_MA;
export const CATEGORIES = ['fishes', 'reptiles', 'amphibians'];
export const CATEGORY_COLORS = {
  fishes: 'border-cyan-400',
  reptiles: 'border-red-400',
  amphibians: 'border-green-400'
};