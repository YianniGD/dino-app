import React, { useEffect } from 'react';

const AnimalDetailsCard = ({ animal, onClose, openXray, isCentered }) => {

  useEffect(() => {
    if (animal) {
    }
  }, [animal]);

  if (!animal) {
    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-500 pointer-events-none">
        <p className="text-2xl font-semibold">Select an animal on the timeline</p>
        <p>to learn more about it.</p>
      </div>
    );
  }

  const imageUrl = animal.overlay_image || '';

  return (
    <div 
      className={`absolute w-full max-w-sm bg-gray-800/80 backdrop-blur-md rounded-lg shadow-2xl p-6 z-[1100] transition-all duration-300 ease-in-out transform ${animal ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'} ${isCentered ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'top-4 right-4'}`}
      role="dialog"
      aria-labelledby="animal-details-heading"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
        aria-label="Close details"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="relative w-full h-48 bg-gray-700/50 rounded-lg mb-4 shadow-lg flex items-center justify-center">
          {imageUrl ? (
            <img
              src={`${process.env.PUBLIC_URL}${imageUrl}`}
              alt={animal.name}
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <span className="text-gray-400">No Image</span>
          )}
        </div>
        <h2 id="animal-details-heading" className="text-3xl font-bold text-white mb-1">{animal.name}</h2>
        <p className="text-sm text-gray-400">{animal.subcategory_name}</p>

        <div className="my-4 w-full border-t border-gray-700" />

        <div className="text-left w-full space-y-3">
          <p className="text-gray-300">{animal.description}</p>
          <div>
            <strong className="text-gray-400">Period:</strong>
            <span className="text-white ml-2">{animal.time_period} ({animal.lived_from_ma} - {animal.lived_to_ma} Ma)</span>
          </div>
          <div>
            <strong className="text-gray-400">Location:</strong>
            <span className="text-white ml-2">{animal.location}</span>
          </div>
        </div>
        {animal.skeleton_image && (
            <button
              onClick={() => openXray(animal)}
              className="mt-4 bg-blue-500/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm hover:bg-blue-600/90 transition-colors"
            >
              Interactive X-Ray
            </button>
        )}
      </div>
    </div>
  );
};

export default AnimalDetailsCard;
