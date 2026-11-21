import { useWindowDimensions } from 'react-native';

export interface ResponsiveMetrics {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  isTabletLandscape: boolean;
  scale: number;
}

/**
 * Responsive layout hook tailored for iPad (Landscape & Portrait) as primary device,
 * while gracefully adapting to iPhone and desktop browsers.
 */
export function useResponsive(): ResponsiveMetrics {
  const { width, height } = useWindowDimensions();
  const minSide = Math.min(width, height);
  const isTablet = minSide >= 640 || width >= 760;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const scale = isTablet ? Math.min(1.32, Math.max(1.08, minSide / 720)) : 1;

  return {
    width,
    height,
    isTablet,
    isLandscape,
    isTabletLandscape,
    scale,
  };
}
