import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  // For web, directly return the color scheme without hydration checks
  // since we're not doing SSR
  const colorScheme = useRNColorScheme();
  return colorScheme || 'light';
}
