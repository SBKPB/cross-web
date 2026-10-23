import { useNavigation } from './navigation';

export function useTheme() {
  const { theme, resolvedTheme, setTheme } = useNavigation();
  return { theme, resolvedTheme, setTheme };
}
