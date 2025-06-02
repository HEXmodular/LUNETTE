import React, { useState, useCallback, useEffect } from 'react';
import './select-control.css';

interface SelectControlProps {
    id: string;
    labels: string[];
    columns?: number;
    mode?: 'multiple' | 'single';
    value?: number;
    values?: number[];
    fontSize?: number;
    disabled?: boolean;
    onChange: (id: string, index: number, value: boolean, values?: boolean[]) => void;
}

export const SelectControl: React.FC<SelectControlProps> = ({
    id,
    labels,
    columns = 4,
    mode = 'multiple',
    value,
    values,
    fontSize = 16,
    disabled,
    onChange,
}) => {
    if (!labels || !Array.isArray(labels) || labels.length === 0) {
        console.error(`SelectControl (id: ${id}): 'labels' prop is missing, not an array, or empty. Rendering null.`);
        return null;
    }

    // console.log('SelectControl id', id, 'value', value);


    // Helper function to initialize or update the active state based on props
    // Ensures that operations are only performed if 'labels' is valid (already checked by the guard clause)
    const getInitialActiveState = useCallback(() => {
        if (mode === 'single' && value !== undefined && value >= 0 && value < labels.length) {
            const initialState = Array(labels.length).fill(false);
            initialState[value] = true;
            return initialState;
        }
        if (mode === 'multiple' && values && Array.isArray(values)) {
            const initialState = Array(labels.length).fill(false);
            values.forEach(idx => {
                if (idx >= 0 && idx < labels.length) {
                    initialState[idx] = true;
                }
            });
            return initialState;
        }
        return Array(labels.length).fill(false);
    }, [labels, mode, value, values]);

    const [isActive, setIsActive] = useState<boolean[]>(getInitialActiveState());

    useEffect(() => {
        if (disabled) {
            // Optionally, you might want to clear active state or handle disabled appearance
            return;
        }
        // Re-initialize state if relevant props change
        setIsActive(getInitialActiveState());
    }, [disabled, value, values, mode, labels, getInitialActiveState]);

    const handleToggle = useCallback((index: number) => {
        if (disabled || index < 0 || index >= labels.length) {
            return;
        }
        
        let newActiveStateArray: boolean[];
        let newSelectedValue: boolean;

        if (mode === 'single') {
            newActiveStateArray = Array(labels.length).fill(false);
            newActiveStateArray[index] = true;
            newSelectedValue = true;
        } else { // mode === 'multiple'
            newActiveStateArray = [...isActive];
            newActiveStateArray[index] = !newActiveStateArray[index];
            newSelectedValue = newActiveStateArray[index];
        }
        
        setIsActive(newActiveStateArray);
        onChange?.(id, index, newSelectedValue, newActiveStateArray);

    }, [disabled, mode, labels, onChange, id, isActive]);

    // const getActiveIndices = useCallback(() => {
    //     return state.map((value, index) => value ? index : -1).filter(index => index !== -1);
    // }, [state]);

    return (
        <div 
            className="logic-block-control"
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: '2px',
                fontSize: `${fontSize}px`
            }}
        >
            {labels.map((label, index) => (
                <button
                    key={index}
                    className={`logic-block-btn ${isActive[index] ? 'active' : ''}`}
                    onClick={() => handleToggle(index)}
                    data-index={index}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};
