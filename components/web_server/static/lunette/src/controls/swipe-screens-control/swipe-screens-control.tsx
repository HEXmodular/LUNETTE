// компонент для свайпа между экранами
// как на мобильных устройствах

import React, { useState, useRef } from 'react';
import type { TouchEvent } from 'react';
import './swipe-screens-control.css';

interface SwipeScreensProps {
  children: React.ReactNode[];
  onScreenChange?: (index: number) => void;
  initialScreen?: number;
}

export const SwipeScreensControl: React.FC<SwipeScreensProps> = ({
  children,
  onScreenChange,
  initialScreen = 0,
}) => {
  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsLongPress(false);
    //если долгое нажатие в течение 500мс, то свайп не работает
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
    }, 500);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isLongPress) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    if (isLongPress) {
      setIsLongPress(false);
      return;
    }
    
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentScreen < React.Children.count(children) - 1) {
      const newScreen = currentScreen + 1;
      setCurrentScreen(newScreen);
      onScreenChange?.(newScreen);
    } else if (isRightSwipe && currentScreen > 0) {
      const newScreen = currentScreen - 1;
      setCurrentScreen(newScreen);
      onScreenChange?.(newScreen);
    }
  };

  return (
    <div
      ref={containerRef}
      className="swipe-screens-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="swipe-screen"
          style={{
            width: '100%',
            height: currentScreen === index ? '100%' : 0,
            opacity: currentScreen === index ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: currentScreen === index ? 'auto' : 'none'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};


