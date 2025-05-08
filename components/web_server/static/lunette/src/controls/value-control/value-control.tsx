import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RoundSliderControl } from '@controls/round-slider-control/round-slider-control';
import './value-control.css';

interface ValueControlProps {
    min?: number;
    max?: number;
    initialValue?: number;
    showLabel?: boolean;
    label?: string;
    id?: string;
    onChange?: (value: number) => void;
    // formatValue?: (value: number) => string;
}

const ValueControl: React.FC<ValueControlProps> = ({
    min = 0,
    max = 100,
    initialValue = 50,
    showLabel = true,
    label = '',
    id = '',
    onChange,
    // formatValue = (value) => value.toString()
}) => {
    const [currentValue, setCurrentValue] = useState(initialValue);
    const [isDragging, setIsDragging] = useState(false);
    const [showRoundSlider, setShowRoundSlider] = useState(false);
    const startYRef = useRef(0);
    const lastYRef = useRef(0);
    const elementRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<number | null>(null);

    const updateValue = useCallback((newValue: number) => {
        const clampedValue = Math.max(min, Math.min(max, newValue));
        setCurrentValue(clampedValue);
        onChange?.(clampedValue);
    }, [min, max, onChange]);

    const handleDragStart = useCallback((y: number) => {
        startYRef.current = y;
        lastYRef.current = y;
        setIsDragging(true);
        if (elementRef.current) {
            elementRef.current.classList.add('active');
        }
    }, []);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        if (elementRef.current) {
            elementRef.current.classList.remove('active');
        }
    }, []);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        
        // Start long press timer before drag
        longPressTimer.current = window.setTimeout(() => {
            setShowRoundSlider(true);
            setIsDragging(false);
            if (elementRef.current) {
                elementRef.current.classList.remove('active');
            }
        }, 500);

        // Don't start drag immediately, wait for movement
        startYRef.current = touch.clientY;
        lastYRef.current = touch.clientY;
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        e.preventDefault();
        
        if (showRoundSlider) {
            return;
        }
        
        const touch = e.touches[0];
        
        // If this is the first move, start dragging
        if (!isDragging) {
            setIsDragging(true);
            if (elementRef.current) {
                elementRef.current.classList.add('active');
            }
            // Cancel long press timer when movement starts
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }
        
        lastYRef.current = touch.clientY;
        
        const deltaY = lastYRef.current - startYRef.current;
        const speed = Math.abs(deltaY) / 20;
        const change = deltaY > 0 ? -speed : speed;
        const newValue = currentValue + change;
        updateValue(newValue);
    }, [isDragging, currentValue, updateValue, showRoundSlider]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        e.preventDefault();
        
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        if (showRoundSlider) {
            setShowRoundSlider(false);
        } else if (isDragging) {
            handleDragEnd();
        }
    }, [isDragging, showRoundSlider, handleDragEnd]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientY);
        
        // Start long press timer
        longPressTimer.current = window.setTimeout(() => {
            setShowRoundSlider(true);
            setIsDragging(false);
        }, 500);
    }, [handleDragStart]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        lastYRef.current = e.clientY;
        
        const deltaY = lastYRef.current - startYRef.current;
        const speed = Math.abs(deltaY) / 20;
        const change = deltaY > 0 ? -speed : speed;
        const newValue = currentValue + change;
        updateValue(newValue);
    }, [isDragging, currentValue, updateValue]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!isDragging && !showRoundSlider) return;
        e.preventDefault();
        
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        if (showRoundSlider) {
            setShowRoundSlider(false);
        } else {
            handleDragEnd();
        }
    }, [isDragging, showRoundSlider, handleDragEnd]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: false });
        element.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            element.removeEventListener('touchcancel', handleTouchEnd);
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseMove, handleMouseUp]);

    return (
        <div 
            ref={elementRef}
            className="value-control"
            onMouseDown={handleMouseDown}
        >
            {showLabel && label && (
                <label htmlFor={id}>{label}</label>
            )}
            <div className="control-container">
                <RoundSliderControl
                    value={currentValue}
                    onChange={updateValue}
                    min={min}
                    max={max}
                    />
            </div>
        </div>
    );
};

export default ValueControl;