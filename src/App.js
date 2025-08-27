import React, { useState, useEffect } from 'react';
import './App.css';
import data from './fauna.json';
import Categories from './components/Categories/Categories';
import Subcategories from './components/Subcategories/Subcategories';
import Species from './components/Species/Species';
import Specimen from './components/Specimen/Specimen';

function App() {
  const [path, setPath] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setPath(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderContent = () => {
    const pathParts = path.substring(1).split('/');
    const [category, subcategory, species] = pathParts;

    if (category && subcategory && species) {
      const categoryData = data[category];
      if (categoryData) {
        const subcategoryData = categoryData.find(
          (sc) => sc.subcategory_name === subcategory
        );
        if (subcategoryData) {
          const specimenData = subcategoryData.species.find(
            (s) => s.name === species
          );
          if (specimenData) {
            return <Specimen specimen={specimenData} />;
          }
        }
      }
    }

    if (category && subcategory) {
      const categoryData = data[category];
      if (categoryData) {
        const subcategoryData = categoryData.find(
          (sc) => sc.subcategory_name === subcategory
        );
        if (subcategoryData) {
          return <Species species={subcategoryData.species} category={category} subcategory={subcategory} />;
        }
      }
    }

    if (category) {
      const categoryData = data[category];
      if (categoryData) {
        return <Subcategories subcategories={categoryData} category={category} />;
      }
    }

    return <Categories data={data} />;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dino-App</h1>
        <a href="#">Home</a>
      </header>
      <main>{renderContent()}</main>
    </div>
  );
}

export default App;