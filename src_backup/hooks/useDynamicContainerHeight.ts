import { useEffect, useState, useRef, RefObject } from 'react';

interface UseDynamicContainerHeightOptions {
  headerOffset?: number;
  statusBarOffset?: number;
  minHeightOffset?: number;
}

/**
 * Hook that monitors the DOM height of the active module workspace shell / viewport
 * and dynamically calculates/applies a minimum height constraint to the main content area
 * to ensure consistent footer/background spacing (preventing white-background collapse).
 */
export function useDynamicContainerHeight(
  options: UseDynamicContainerHeightOptions = {}
): {
  containerRef: RefObject<HTMLDivElement | null>;
  minHeightStyle: React.CSSProperties;
} {
  const { headerOffset = 112, statusBarOffset = 48, minHeightOffset = 80 } = options;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [minHeight, setMinHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.max(250, window.innerHeight - headerOffset - statusBarOffset - minHeightOffset);
    }
    return 650;
  });

  useEffect(() => {
    const updateHeight = () => {
      const windowH = window.innerHeight;
      const calculated = Math.max(300, windowH - headerOffset - statusBarOffset - minHeightOffset);
      setMinHeight(calculated);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const rect = entry.contentRect;
          if (rect && rect.height > 0) {
            updateHeight();
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateHeight);
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [headerOffset, statusBarOffset, minHeightOffset]);

  const minHeightStyle: React.CSSProperties = {
    minHeight: `${minHeight}px`,
  };

  return {
    containerRef,
    minHeightStyle,
  };
}
