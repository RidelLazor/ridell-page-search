import { useState, useRef, useCallback } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: SwipeGestureOptions) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setSwiping(true);
    setSwipeOffset({ x: 0, y: 0 });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;
    
    setSwipeOffset({ x: deltaX, y: deltaY });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;

    const { x: deltaX, y: deltaY } = swipeOffset;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if horizontal or vertical swipe
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    touchStartRef.current = null;
    setSwiping(false);
    setSwipeOffset({ x: 0, y: 0 });
  }, [swipeOffset, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swiping,
    swipeOffset,
  };
};
