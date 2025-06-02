// нужен атрибут который будет отображать длину секвенсора, это крестик в квадрате соответствующего шага

import React, { useState } from 'react';
import './sequencer-control.css';

interface SequencerControlProps {
  onChange?: (activeCells: boolean[]) => void;
  onMenuClick?: () => void;
  currentStep?: number;
  sequenceLength?: number;
  label?: string;
}

export const SequencerControl: React.FC<SequencerControlProps> = ({
  onChange,
  onMenuClick,
  currentStep = -1,
  sequenceLength = 8,
  label = ''
}) => {
  const [cells, setCells] = useState<boolean[]>(Array(8).fill(false));

  const handleCellClick = (index: number) => {
    const newCells = [...cells];
    newCells[index] = !newCells[index];
    setCells(newCells);
    onChange?.(newCells);
  };

  return (
    <div className="sequencer-control">
      <div className="sequencer-label">{label}</div>
      {cells.map((isActive, index) => (
        <button
          key={index}
          className={`sequencer-cell ${isActive ? 'active' : ''} ${index === currentStep ? 'current' : ''} ${index === sequenceLength - 1 ? 'length-indicator' : ''}`}
          onClick={() => handleCellClick(index)}
        >
          {index === sequenceLength - 1 && <span className="length-cross">×</span>}
        </button>
      ))}
      <button
        className="sequencer-menu-button"
        onClick={onMenuClick}
        aria-label="Menu"
      >
        ≡
      </button>
    </div>
  );
};
