import React from 'react';
import { useDraggableScroll } from '../../hooks/useDraggableScroll';

const SpeciesMarker = ({ species, onClick, isAbove, style }) => (
    <div 
        className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 flex items-center z-10 ${isAbove ? 'flex-col-reverse' : 'flex-col'}`}
        style={style}
    >
        <button
            onClick={onClick}
            className={`my-6 bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg text-center w-44 hover:bg-cyan-500/20 border border-gray-700 hover:border-cyan-400 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-lg`}
            aria-label={`Learn more about ${species.name}`}
        >
            <h4 className="font-semibold text-md text-cyan-200 truncate">{species.name}</h4>
        </button>
        <div className="w-px h-6 bg-cyan-400/70" aria-hidden="true"></div>
        <div className="w-4 h-4 bg-cyan-400 rounded-full border-2 border-gray-900" aria-hidden="true"></div>
    </div>
);


export const Timeline = ({ eras, onSpeciesClick }) => {
  const scrollRef = useDraggableScroll();
  const eraWidthVw = 90; 
  const totalWidth = eras.length * eraWidthVw;

  return (
    <div 
      ref={scrollRef} 
      className="w-full h-[calc(100vh-200px)] flex items-center overflow-x-auto cursor-grab snap-x snap-mandatory"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="relative h-full flex p-8" style={{ width: `${totalWidth}vw`, minWidth: '100%' }}>
        <div 
            className="absolute top-1/2 left-0 right-0 h-1 bg-cyan-700/50 -translate-y-1/2" 
            aria-hidden="true"
        ></div>

        {eras.map((era) => (
          <div 
            key={era.name} 
            className="relative h-full flex-shrink-0" 
            style={{ width: `${eraWidthVw}vw` }}
          >
            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center p-4 w-full max-w-lg">
              <h2 className="text-5xl font-bold text-white drop-shadow-lg">{era.name}</h2>
              <p className="text-xl font-light text-gray-300 mt-2">{era.timeRange}</p>
            </div>

            {era.species.map((species, speciesIndex) => {
              const leftPosition = `${(speciesIndex + 1) * (100 / (era.species.length + 1))}%`;
              return (
                <SpeciesMarker 
                  key={species.name}
                  species={species}
                  onClick={() => onSpeciesClick(species)}
                  isAbove={speciesIndex % 2 === 0}
                  style={{ left: leftPosition }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};