import React from 'react';
import { CATEGORY_COLORS } from '../constants.js';

const FilterControls = ({
  categories,
  animalData,
  selectedSubcategories,
  onCategoryFilterChange,
  onSubcategoryFilterChange
}) => {
  const getCategoryButtonClasses = (category) => {
    const subcategoriesOfCategory = animalData[category].map(sc => sc.subcategory_name);
    const areAllSelected = subcategoriesOfCategory.every(sc => selectedSubcategories.includes(sc));
    const colorClass = CATEGORY_COLORS[category.toLowerCase()] || 'border-gray-400';
    
    return `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white
      ${areAllSelected 
        ? `${colorClass.replace('border-', 'bg-').replace('400', '500/30')} ${colorClass} text-white` 
        : `bg-gray-700/50 border-transparent hover:bg-gray-600/80 text-gray-300`
      }`;
  };

  const getSubcategoryButtonClasses = (subcategory) => {
    const isSelected = selectedSubcategories.includes(subcategory);
    const category = Object.keys(animalData).find(cat => 
      animalData[cat].some(sc => sc.subcategory_name === subcategory)
    );
    const colorClass = category ? CATEGORY_COLORS[category.toLowerCase()] : 'border-gray-400';

    return `px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ease-in-out border focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-800 focus:ring-white
      ${isSelected
        ? `${colorClass.replace('border-', 'bg-').replace('400', '500/20')} ${colorClass} text-white`
        : `bg-gray-600/40 border-transparent hover:bg-gray-500/60 text-gray-400`
      }`;
  };

  return (
    <div className="p-2 bg-gray-800/50 rounded-lg backdrop-blur-sm">
      <div className="flex justify-center items-center flex-wrap gap-2 md:gap-4">
        <span className="font-semibold mr-2 text-gray-300 hidden md:inline">Filter by Category:</span>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onCategoryFilterChange(category)}
            className={getCategoryButtonClasses(category)}
            aria-pressed={animalData[category].every(sc => selectedSubcategories.includes(sc.subcategory_name))}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-center items-center flex-wrap gap-2">
        {Object.keys(animalData).map(category => (
          <React.Fragment key={category}>
            {animalData[category].map(subcategory => (
              <button
                key={subcategory.subcategory_name}
                onClick={() => onSubcategoryFilterChange(subcategory.subcategory_name)}
                className={getSubcategoryButtonClasses(subcategory.subcategory_name)}
                aria-pressed={selectedSubcategories.includes(subcategory.subcategory_name)}
              >
                {subcategory.subcategory_name}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default FilterControls;
