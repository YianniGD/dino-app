import React from 'react';
import { TIMELINE_START_MA, CATEGORY_COLORS } from '../constants.js';

const TimelineEvent = ({
  animal,
  onSelectAnimal,
  pixelsPerMa,
  rowIndex,
  subcategoryIndex,
  isSelected,
  subcategoryLayout
}) => {
  const layout = subcategoryLayout[animal.subcategory_name] || { offset: subcategoryIndex * 80, spacing: 32 };
  const left = (TIMELINE_START_MA - animal.lived_from_ma_float) * pixelsPerMa;
  const width = Math.max((animal.lived_from_ma_float - animal.lived_to_ma_float) * pixelsPerMa, 10);
  const top = layout.offset + (rowIndex * layout.spacing) + 10;
  const categoryColor = CATEGORY_COLORS[animal.category.toLowerCase()] || 'border-gray-400';
  const zIndex = isSelected ? 1000 : Math.round(TIMELINE_START_MA - animal.lived_from_ma_float);

  return (
    <div
      className={`absolute h-6 flex items-center px-2 rounded-md cursor-pointer group transition-all duration-200 ease-in-out transform hover:scale-105 ${isSelected ? 'scale-105' : ''}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        top: `${top}px`,
        zIndex
      }}
      onClick={(e) => { e.stopPropagation(); onSelectAnimal(animal); }}
    >
      <div className={`absolute inset-0 bg-gray-700/60 backdrop-blur-sm border-l-4 ${categoryColor} rounded-md group-hover:bg-gray-600/80 transition-colors ${isSelected ? 'bg-indigo-500/50' : ''}`} />
      {animal.image && <img src={`${process.env.PUBLIC_URL}/dinosvg/${animal.image}`} alt={animal.name} className="w-4 h-4 mr-2 relative z-10" />}
      <span className="text-xs text-white truncate relative z-10 font-medium">{animal.name}</span>
    </div>
  );
};

export default React.memo(TimelineEvent);
