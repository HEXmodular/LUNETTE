import React, { useEffect, useRef, useState, useCallback } from 'react';
import './value-control.css';

interface ValueControlProps {
    min?: number;
    max?: number;
    value?: number;
    showLabel?: boolean;
    label?: string;
    id?: string;
    sensitivity?: number;
    formatValue?: (value: number) => string;
    onChange?: (value: number) => void;
}

interface Position {
    x: number;
    y: number;
}

type ReactPointerEvent = React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>;
type NativePointerEvent = MouseEvent | TouchEvent;

const ValueControl: React.FC<ValueControlProps> = ({
    min = 0,
    max = 100,
    value = 50,
    showLabel = true,
    label = '',
    id = '',
    sensitivity = 1,
    formatValue = (value) => Math.round(value).toString(),
    onChange,
}) => {
    const [currentValue, setCurrentValue] = useState(value);
    const [isActive, setIsActive] = useState(false);
    const [buttonPosition, setButtonPosition] = useState<Position>({ x: 0, y: 0 });
    const [isOverHandle, setIsOverHandle] = useState(false);
    const startYRef = useRef(0);
    const lastYRef = useRef(0);
    const elementRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    // const startPosition = useRef<Position>({ x: 0, y: 0 });
    const longPressTimer = useRef<number | null>(null);
    const isTimerCancelled = useRef(false);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const updateValue = useCallback((newValue: number) => {
        const clampedValue = Math.max(min, Math.min(max, newValue));
        setCurrentValue(clampedValue);
        onChange?.(clampedValue);
    }, [min, max, onChange]);

    const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    };

    const getHandlePosition = (value: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const angle = ((value - min) / (max - min)) * 360;
        const radians = (angle * Math.PI) / 180;
        const radius = 100;

        return {
            x: centerX + radius * Math.sin(radians),
            y: centerY - radius * Math.cos(radians)
        };
    };

    const calculateAngle = (clientX: number, clientY: number) => {
        if (!containerRef.current) return 0;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const angle = Math.atan2((clientY - centerY), clientX - centerX) * (180 / Math.PI);
        return (angle + 470) % 360;
    };

    const updateButtonPosition = (clientX: number, clientY: number) => {
        if (containerRef.current) {
            const angle = calculateAngle(clientX, clientY);
            setButtonPosition({ x: clientX, y: clientY });

            if (isOverHandle) {
                const newValue = ((angle / 360) * (max - min)) + min;
                const clampedValue = Math.min(Math.max(newValue, min), max);
                setCurrentValue(clampedValue);
                onChange?.(clampedValue);
                return;
            }

            const handlePos = getHandlePosition(currentValue);
            const distance = calculateDistance(clientX, clientY, handlePos.x, handlePos.y);
            const isOver = distance < 100;

            if (isOver) {
                setIsOverHandle(isOver);
            }

        }
    };

    const getEventPosition = (e: ReactPointerEvent): Position => {
        if ('touches' in e) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    };

    const getNativeEventPosition = (e: NativePointerEvent): Position => {
        if ('touches' in e) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    };

    const handlePointerStart = (e: ReactPointerEvent) => {
        e.preventDefault();
        console.log("ValueControl handlePointerStart")
        const pos = getEventPosition(e);
        
        isTimerCancelled.current = false;
        longPressTimer.current = window.setTimeout(() => {
            if (!isTimerCancelled.current) {
                // console.log("ValueControl longPressTimer")
                const pos = getEventPosition(e);
                setIsActive(true);
                updateButtonPosition(pos.x, pos.y);
            }
        }, 750);

        startYRef.current = pos.y;
        lastYRef.current = pos.y;
    };

    const handlePointerMove = (e: ReactPointerEvent) => {
        e.preventDefault();
        const pos = getEventPosition(e);
        
        if (isActive) {
            updateButtonPosition(pos.x, pos.y);
        } else {
            lastYRef.current = pos.y;
            const deltaY = lastYRef.current - startYRef.current;
            const speed = (Math.abs(deltaY) / 20) * sensitivity;
            const change = deltaY > 0 ? -speed : speed;
            const newValue = currentValue + change;
            updateValue(newValue);
            if (longPressTimer.current) {
                console.log("ValueControl handlePointerMove clearTimeout")
                isTimerCancelled.current = true;
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }
    };


    const handlePointerEnd = useCallback((e: ReactPointerEvent) => {
        e.preventDefault();
        // console.log("ValueControl handleReactPointerEnd")

        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        setIsActive(false);
        setIsOverHandle(false);
        if (elementRef.current) {
            elementRef.current.classList.remove('active');
        }
    }, []);

    // useEffect(() => {
    //     const element = elementRef.current;
    //     if (!element) return;

    //     document.addEventListener('mousemove', handlePointerMove);
    //     document.addEventListener('mouseup', handlePointerEnd);
    //     document.addEventListener('touchmove', handlePointerMove, { passive: false });
    //     document.addEventListener('touchend', handlePointerEnd);
    //     document.addEventListener('touchcancel', handlePointerEnd);

    //     return () => {
    //         document.removeEventListener('mousemove', handlePointerMove);
    //         document.removeEventListener('mouseup', handlePointerEnd);
    //         document.removeEventListener('touchmove', handlePointerMove);
    //         document.removeEventListener('touchend', handlePointerEnd);
    //         document.removeEventListener('touchcancel', handlePointerEnd);

    //         if (longPressTimer.current) {
    //             clearTimeout(longPressTimer.current);
    //         }
    //     };
    // }, [handlePointerMove, handlePointerEnd]);

    const handleStyle = {
        transform: `rotate(${(currentValue - min) / (max - min) * 360}deg) translateY(-100px) translateX(-50%)`
    };

    const buttonStyle = isActive ? {
        left: `${buttonPosition.x}px`,
        top: `${buttonPosition.y}px`
    } : {};

    return (
        <div
            ref={elementRef}
            className="value-control"
            // onMouseDown={handlePointerStart}
            // onTouchStart={handlePointerStart}
        >
            {showLabel && label && (
                <label htmlFor={id}>{label}</label>
            )}
            <div className="control-container">
                <button
                    ref={buttonRef}
                    className={`slider-button ${isActive ? 'active' : ''} ${isOverHandle ? 'over-handle' : ''}`}
                    style={buttonStyle}
                    onMouseDown={handlePointerStart}
                    onMouseMove={handlePointerMove}
                    onMouseUp={handlePointerEnd}                    
                    onTouchStart={handlePointerStart}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerEnd}
                >
                    {formatValue(currentValue)}
                </button>

                <div className={`overlay ${isActive ? 'visible' : ''} ${isOverHandle ? 'over-handle' : ''}`}>
                    <div
                        ref={containerRef}
                        className="slider-container"
                    >
                        <div className="slider-track">
                            {formatValue(currentValue)}
                        </div>
                        <div className={`slider-handle ${isOverHandle ? 'over-handle' : ''}`} style={handleStyle}>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ValueControl;