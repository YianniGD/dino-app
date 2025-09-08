import { useRef, useEffect, useCallback } from 'react';

export const useDraggableScroll = () => {
  const ref = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e) => {
    if (ref.current) {
      isDragging.current = true;
      startX.current = e.pageX - ref.current.offsetLeft;
      scrollLeft.current = ref.current.scrollLeft;
      ref.current.style.cursor = 'grabbing';
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    if (ref.current) {
      isDragging.current = false;
      ref.current.style.cursor = 'grab';
    }
  }, []);

  const onMouseUp = useCallback(() => {
    if (ref.current) {
      isDragging.current = false;
      ref.current.style.cursor = 'grab';
    }
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 2; //scroll-fast
    ref.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.addEventListener('mousedown', onMouseDown);
      element.addEventListener('mouseleave', onMouseLeave);
      element.addEventListener('mouseup', onMouseUp);
      element.addEventListener('mousemove', onMouseMove);

      return () => {
        element.removeEventListener('mousedown', onMouseDown);
        element.removeEventListener('mouseleave', onMouseLeave);
        element.removeEventListener('mouseup', onMouseUp);
        element.removeEventListener('mousemove', onMouseMove);
      };
    }
  }, [onMouseDown, onMouseLeave, onMouseUp, onMouseMove]);

  return ref;
};