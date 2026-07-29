import { useAppTheme } from './theme-context';

export function useColorScheme() {
  const { theme } = useAppTheme();
  return theme;
}
