import React from 'react';
import './GameModal.css';

const GameModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="game-modal-overlay" onClick={onClose}>
      <div className="game-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="game-modal-close" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};

export default GameModal;