import React, { useState, useEffect } from 'react';
import { SequencerControl } from '@controls/sequencer-control/sequencer-control';
// import { Sequencer } from '@controls/sequencer-control/sequencer';
import './sequencer-select.css';

interface SequencerSelectProps {
    label: string;
    sequenceLength: number;
    rows: number;
    currentStep: number;
    values: boolean[];
    onMenuClick: () => void;
    onChange: (values: boolean[][]) => void;
}

export const SequencerSelect: React.FC<SequencerSelectProps> = ({ 
    label,
    sequenceLength, 
    rows, 
    currentStep, 
    values, 
    onMenuClick, 
    onChange 
}) => {
    // State for sequencer values
    const [sequencerValues, setSequencerValues] = useState<boolean[][]>(
        Array(rows).fill(null).map(() => Array(sequenceLength).fill(false))
    );
    const [pendingOnChangeData, setPendingOnChangeData] = useState<boolean[][] | null>(null);
    const [pendingMenuClick, setPendingMenuClick] = useState<boolean>(false);

    // Update sequencer values when values prop changes
    useEffect(() => {
        if (values.length > 0) {
            setSequencerValues(prev => {
                const newValues = [...prev];
                newValues[0] = values;
                return newValues;
            });
        }
    }, [values]);

    // Handle changes in rows prop
    useEffect(() => {
        setSequencerValues(prev => {
            const newValues = Array(rows).fill(null).map((_, rowIndex) => {
                // If we have existing values for this row, use them
                if (rowIndex < prev.length) {
                    return [...prev[rowIndex]];
                }
                // Otherwise create a new row of false values
                return Array(sequenceLength).fill(false);
            });
            return newValues;
        });
    }, [rows, sequenceLength]);

    // Effect to handle pending onChange data
    useEffect(() => {
        if (pendingOnChangeData !== null) {
            onChange(pendingOnChangeData);
            setPendingOnChangeData(null);
        }
    }, [pendingOnChangeData, onChange]);

    // Effect to handle pending menu click
    useEffect(() => {
        if (pendingMenuClick) {
            onMenuClick(); // Call the original onMenuClick prop
            setPendingMenuClick(false);
        }
    }, [pendingMenuClick, onMenuClick]);

    const handleLocalMenuClick = () => {
        setPendingMenuClick(true);
    };

    const handleValueChange = (sequencerIndex: number, newValues: boolean[]) => {
        setSequencerValues(prev => {
            const newStates = [...prev];

            // For each column, ensure only one value is true
            for (let col = 0; col < sequenceLength; col++) {
                if (newValues[col]) { // newValues is for the current row (sequencerIndex)
                    // If this column is being set to true for the current row,
                    // set all other rows' columns to false for that column.
                    for (let seq = 0; seq < rows; seq++) {
                        if (seq !== sequencerIndex) {
                            if (newStates[seq]) { // Ensure row exists
                                newStates[seq][col] = false;
                            }
                        }
                    }
                }
            }
            if (newStates[sequencerIndex]) { // Ensure row exists
               newStates[sequencerIndex] = newValues; // Update the specific row
            }

            // Instead of calling onChange directly:
            setPendingOnChangeData(newStates);
            return newStates; // This updates local sequencerValues
        });
    };

    return (
        <div className="sequencer-select-scroll-container">
            <div className="sequencer-select-container"
                data-length={sequenceLength}
            >
            {sequencerValues.map((values, index) => (
                <SequencerControl
                    key={index}
                    label={index === 0 ? label : ''}
                    sequenceLength={sequenceLength}
                    currentStep={currentStep}
                    onMenuClick={handleLocalMenuClick}
                    onChange={(values: boolean[]) => handleValueChange(index, values)}
                    hideMenu={index !== 0}
                    highlightedCells={Array(sequenceLength).fill(false).map((_, i) => i % 4 === 0)}
                    />
                ))}
            </div>
        </div>
    );
};