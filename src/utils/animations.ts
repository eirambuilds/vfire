
import { useEffect, useState } from 'react';

export const usePageTransition = () => {
  const [animate, setAnimate] = useState({
    opacity: 0,
    transform: 'translateY(10px)',
  });

  useEffect(() => {
    // Apply the transition after component mounts
    const timeoutId = setTimeout(() => {
      setAnimate({
        opacity: 1,
        transform: 'translateY(0)',
      });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, []);

  return { animate };
};

export const useFadeIn = (delay = 0) => {
  const [style, setStyle] = useState({
    opacity: 0,
    transform: 'translateY(10px)',
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setStyle({
        opacity: 1,
        transform: 'translateY(0)',
      });
      
      // Apply transitions after setting initial values
      const transitionTimeoutId = setTimeout(() => {
        const element = document.getElementById('fade-in-element');
        if (element) {
          element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        }
      }, 0);
      
      return () => clearTimeout(transitionTimeoutId);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [delay]);

  return { style };
};
