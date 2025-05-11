import React, { useState, useCallback } from 'react';
import './select-control.css';

interface SelectControlProps {
    id: string;
    labels: string[];
    columns?: number;
    mode?: 'multiple' | 'single';
    onChange: (id: string, index: number, value: boolean) => void;
    initialValues?: boolean[];
}

export const SelectControl: React.FC<SelectControlProps> = ({
    id,
    labels,
    columns = 4,
    mode = 'multiple',
    onChange,
    initialValues = []
}) => {
    const [state, setState] = useState<boolean[]>(
        initialValues.length > 0 ? initialValues : Array(labels.length).fill(false)
    );

    const handleToggle = useCallback((index: number) => {
        if (mode === 'single') {
            const newState = Array(labels.length).fill(false);
            newState[index] = true;
            setState(newState);
            onChange?.(id, index, true);
        } else {
            setState(prevState => {
                const newState = [...prevState];
                newState[index] = !newState[index];
                onChange?.(id, index, newState[index]);
                return newState;
            });
        }
    }, [mode, labels.length, onChange, id]);

    // const getActiveIndices = useCallback(() => {
    //     return state.map((value, index) => value ? index : -1).filter(index => index !== -1);
    // }, [state]);

    return (
        <div 
            className="logic-block-control"
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: '2px'
            }}
        >
            {labels.map((label, index) => (
                <button
                    key={index}
                    className={`logic-block-btn ${state[index] ? 'active' : ''}`}
                    onClick={() => handleToggle(index)}
                    data-index={index}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};

// Helper functions to maintain API compatibility
export const getState = (state: boolean[], index: number): boolean => state[index];
export const getActiveIndices = (state: boolean[]): number[] => 
    state.map((value, index) => value ? index : -1).filter(index => index !== -1);