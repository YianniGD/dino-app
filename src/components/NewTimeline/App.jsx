import React, { useState, useMemo } from 'react';
import { animalData } from './data.js';
import { CATEGORIES } from './constants.js';
import Timeline from './components/Timeline.jsx';
import AnimalDetailsCard from './components/AnimalDetailsCard.jsx';
import FilterControls from './components/FilterControls.jsx';

// Data preprocessing to add float values and unique IDs
const allAnimals = Object.keys(animalData).flatMap(category => 
  animalData[category].flatMap(subcategory => 
    subcategory.species.map(animal => ({
      ...animal,
      id: `${category}-${subcategory.subcategory_name}-${animal.name}`,
      category: category,
      subcategory_name: subcategory.subcategory_name,
      lived_from_ma_float: parseFloat(animal.lived_from_ma),
      lived_to_ma_float: parseFloat(animal.lived_to_ma),
    }))
  )
);

const allSubcategories = [...new Set(allAnimals.map(animal => animal.subcategory_name))];

function App() {
  const [selectedSubcategories, setSelectedSubcategories] = useState(allSubcategories);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  const handleCategoryFilterChange = (category) => {
    const subcategoriesOfCategory = animalData[category].map(sc => sc.subcategory_name);
    const areAllSelected = subcategoriesOfCategory.every(sc => selectedSubcategories.includes(sc));

    if (areAllSelected) {
      setSelectedSubcategories(prev => prev.filter(sc => !subcategoriesOfCategory.includes(sc)));
    } else {
      setSelectedSubcategories(prev => [...new Set([...prev, ...subcategoriesOfCategory])]);
    }
    setSelectedAnimal(null);
  };

  const handleSubcategoryFilterChange = (subcategory) => {
    setSelectedSubcategories(prev => {
      const newSubcategories = prev.includes(subcategory)
        ? prev.filter(sc => sc !== subcategory)
        : [...prev, subcategory];
      return newSubcategories.length === 0 ? allSubcategories : newSubcategories;
    });
    setSelectedAnimal(null);
  };

  const filteredAnimals = useMemo(() => {
    return allAnimals.filter(animal => selectedSubcategories.includes(animal.subcategory_name));
  }, [selectedSubcategories]);

  const handleSelectAnimal = (animal) => {
    setSelectedAnimal(animal);
  };

  const handleCloseDetails = () => {
    setSelectedAnimal(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col p-4 md:p-8 bg-gray-900 text-white font-sans overflow-hidden">
      <header className="mb-4 text-center">
        <p className="text-gray-400 mt-1 text-2xl">Explore creatures from millions of years ago.</p>
      </header>
      
      <FilterControls 
        categories={CATEGORIES}
        animalData={animalData}
        selectedSubcategories={selectedSubcategories}
        onCategoryFilterChange={handleCategoryFilterChange}
        onSubcategoryFilterChange={handleSubcategoryFilterChange}
      />
      
      <main className="flex-grow relative mt-4 min-h-0">
        <Timeline 
          animals={filteredAnimals}
          onSelectAnimal={handleSelectAnimal}
          selectedAnimal={selectedAnimal}
          onDeselectAnimal={handleCloseDetails}
        />
        <AnimalDetailsCard 
          animal={selectedAnimal}
          onClose={handleCloseDetails}
        />
      </main>
    </div>
  );
};

export default App;
