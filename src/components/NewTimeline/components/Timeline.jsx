import React, { useRef, useEffect, useState } from 'react';
import { GEOLOGIC_PERIODS, TIMELINE_SPAN, TIMELINE_START_MA } from '../constants.js';
import TimelineEvent from './TimelineEvent.jsx';
import { subcategoryLayout } from '../subcategoryLayout.js';

const PIXELS_PER_MA = 20;
const TIMELINE_WIDTH = TIMELINE_SPAN * PIXELS_PER_MA;

const PERIOD_TO_ERA = {
  'Cretaceous': 'Mesozoic',
  'Jurassic': 'Mesozoic',
  'Triassic': 'Mesozoic',
  'Permian': 'Paleozoic',
  'Carboniferous': 'Paleozoic',
  'Devonian': 'Paleozoic',
  'Silurian': 'Paleozoic',
  'Ordovician': 'Paleozoic',
};

const Timeline = ({
  animals,
  onSelectAnimal,
  selectedAnimal,
  onDeselectAnimal
}) => {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [currentYear, setCurrentYear] = useState(TIMELINE_START_MA);
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [currentEra, setCurrentEra] = useState('');

  // This effect will scroll the timeline to the selected animal
  useEffect(() => {
    if (selectedAnimal && timelineRef.current) {
      const animalLeft = (TIMELINE_START_MA - selectedAnimal.lived_from_ma_float) * PIXELS_PER_MA;
      const timelineWidth = timelineRef.current.clientWidth;
      
      timelineRef.current.scrollTo({
        left: animalLeft - (timelineWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [selectedAnimal]);

  const handleWheel = (event) => {
    event.preventDefault();
    timelineRef.current.scrollLeft += event.deltaY;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - timelineRef.current.offsetLeft);
    setStartY(e.pageY - timelineRef.current.offsetTop);
    setScrollLeft(timelineRef.current.scrollLeft);
    setScrollTop(timelineRef.current.scrollTop);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - timelineRef.current.offsetLeft;
    const y = e.pageY - timelineRef.current.offsetTop;
    const walkX = (x - startX) * 2; //scroll-fast
    const walkY = (y - startY) * 2; //scroll-fast
    timelineRef.current.scrollLeft = scrollLeft - walkX;
    timelineRef.current.scrollTop = scrollTop - walkY;
  };

  const handleScroll = () => {
    if (timelineRef.current) {
      const scrollLeft = timelineRef.current.scrollLeft;
      const timelineWidth = timelineRef.current.clientWidth;
      const maPerPixel = 1 / PIXELS_PER_MA;
      const maFromLeft = (scrollLeft + timelineWidth / 2) * maPerPixel;
      const year = TIMELINE_START_MA - maFromLeft;
      setCurrentYear(year);

      const period = GEOLOGIC_PERIODS.find(p => year >= p.end && year < p.start);
      if (period) {
        setCurrentPeriod(period.name);
        setCurrentEra(PERIOD_TO_ERA[period.name]);
      } else {
        setCurrentPeriod('');
        setCurrentEra('');
      }
    }
  };

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900/50 backdrop-blur-sm p-2 rounded-b-lg z-[1200] flex items-center space-x-4">
        <span className="text-white font-bold text-lg">{Math.round(currentYear)} Ma</span>
        {currentPeriod && <span className="text-white text-lg">({currentPeriod})</span>}
        {currentEra && <span className="text-white text-lg font-semibold">{currentEra} Era</span>}
      </div>
      <div 
        ref={timelineRef}
        className="w-full h-full overflow-x-auto overflow-y-auto border border-gray-700 rounded-lg bg-gray-800/50 p-4 relative select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onScroll={handleScroll}
        onClick={onDeselectAnimal}
      >
        <div
          className="relative"
          style={{
            width: `${TIMELINE_WIDTH}px`,
            height: '1500px'
          }}
        >
          {GEOLOGIC_PERIODS.map(period => (
            <div
              key={period.name}
              className={`absolute top-0 bottom-0 ${period.color} rounded-md`}
              style={{
                left: `${(TIMELINE_START_MA - period.start) * PIXELS_PER_MA}px`,
                width: `${(period.start - period.end) * PIXELS_PER_MA}px`,
                height: 'calc(100% - 40px)' // Leave space for time markers
              }}
            >
              <span className="absolute top-2 left-2 text-white font-bold text-lg opacity-50">
                {period.name}
              </span>
            </div>
          ))}
          
          <div className="relative h-full pt-10">
            {Object.entries(
              animals.reduce((acc, animal) => {
                if (!acc[animal.subcategory_name]) {
                  acc[animal.subcategory_name] = [];
                }
                acc[animal.subcategory_name].push(animal);
                return acc;
              }, {})
            ).map(([subcategory, animals], subcategoryIndex) => (
              <div key={subcategory}>
                {animals.map((animal, index) => (
                  <TimelineEvent
                    key={animal.id || `${animal.name}-${index}`}
                    animal={animal}
                    onSelectAnimal={onSelectAnimal}
                    pixelsPerMa={PIXELS_PER_MA}
                    rowIndex={index}
                    subcategoryIndex={subcategoryIndex}
                    isSelected={selectedAnimal?.id === animal.id}
                    subcategoryLayout={subcategoryLayout}
                  />
                ))}
              </div>
            ))}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-10">
            {Array.from({
              length: TIMELINE_SPAN / 50 + 1
            }).map((_, i) => {
              const year = TIMELINE_START_MA - i * 50;
              return (
                <div
                  key={year}
                  className="absolute h-full text-center"
                  style={{
                    left: `${i * 50 * PIXELS_PER_MA}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="h-2 w-px bg-gray-400" />
                  <span className="text-xs text-gray-400">{year} Ma</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
