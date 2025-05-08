import React, { useState, useRef, useEffect } from 'react';
import './round-slider-control.css';

interface RoundSliderControlProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    // initialValue?: number;
    forceOpen?: boolean;
}

export const RoundSliderControl: React.FC<RoundSliderControlProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    // initialValue = 50,
    forceOpen = false,
}) => {
    const [isActive, setIsActive] = useState(forceOpen);
    const [currentValue, setCurrentValue] = useState(value);
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
    const [isOverHandle, setIsOverHandle] = useState(false);
    const pressTimer = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const startPosition = useRef({ x: 0, y: 0 });
    let isAttachedFlag = false;

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const updateButtonPosition = (clientX: number, clientY: number) => {
        if (containerRef.current) {
            const angle = calculateAngle(clientX, clientY);
            setButtonPosition({ x: clientX, y: clientY });

            if (isAttachedFlag) {
                const newValue = ((angle / 360) * (max - min)) + min;
                const clampedValue = Math.min(Math.max(newValue, min), max);
                setCurrentValue(clampedValue);
                onChange(clampedValue);
                return;
            }

            const handlePos = getHandlePosition(currentValue);
            const distance = calculateDistance(clientX, clientY, handlePos.x, handlePos.y);
            const isOver = distance < 70;
            
            if (isOver) {
                isAttachedFlag = true;
            }

            setIsOverHandle(isOver);
        }
    };

    const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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

    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            if (isActive) {
                e.preventDefault();
                updateButtonPosition(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => {
            document.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isActive, max, min, onChange, currentValue]);

    const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        startPosition.current = { x: clientX, y: clientY };

        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setButtonPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            });
        }

        pressTimer.current = window.setTimeout(() => {
            setIsActive(true);
            updateButtonPosition(clientX, clientY);
        }, 500);
    };

    const handlePressEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
        setIsActive(false);
        setIsOverHandle(false);
        isAttachedFlag = false;
    };

    const calculateAngle = (clientX: number, clientY: number) => {
        if (!containerRef.current) return 0;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const angle = Math.atan2((clientY - centerY), clientX - centerX) * (180 / Math.PI);
        return (angle + 470) % 360;
    };

    useEffect(() => {
        return () => {
            if (pressTimer.current) {
                clearTimeout(pressTimer.current);
            }
        };
    }, []);

    const handleStyle = {
        transform: `rotate(${(currentValue - min) / (max - min) * 360}deg) translateY(-100px) translateX(-50%)`
    };

    const buttonStyle = isActive ? {
        left: `${buttonPosition.x}px`,
        top: `${buttonPosition.y}px`
    } : {};

    return (
        <>
            <button
                ref={buttonRef}
                className={`slider-button ${isActive ? 'active' : ''} ${isOverHandle ? 'over-handle' : ''}`}
                style={buttonStyle}
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
            >
                {Math.round(currentValue)}
            </button>

            <div className={`overlay ${isActive ? 'visible' : ''}`}>
                <div
                    ref={containerRef}
                    className="slider-container"
                >
                    <div className="slider-track" >
                    {Math.round(currentValue)} 
                    </div>
                    <div className={`slider-handle ${isOverHandle ? 'over-handle' : ''}`} style={handleStyle}>
                    </div>
                </div>
            </div>
        </>
    );
};
