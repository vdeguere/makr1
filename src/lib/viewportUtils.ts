import { useState, useEffect } from 'react';

export const useViewportDimensions = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isPortrait: window.innerHeight > window.innerWidth,
    isLandscape: window.innerWidth > window.innerHeight,
    aspectRatio: window.innerWidth / window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        isPortrait: window.innerHeight > window.innerWidth,
        isLandscape: window.innerWidth > window.innerHeight,
        aspectRatio: window.innerWidth / window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
};
