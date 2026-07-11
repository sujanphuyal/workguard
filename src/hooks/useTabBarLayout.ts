import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme/tokens';

/** Visible tab bar content height excluding the device bottom inset. */
export const TAB_BAR_CONTENT_HEIGHT = 56;

export function useTabBarLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const height = TAB_BAR_CONTENT_HEIGHT + bottomInset;

  return {
    bottomInset,
    height,
    paddingTop: spacing.xs,
    paddingBottom: bottomInset,
    /** Offset for floating action buttons above the tab bar. */
    fabBottom: height + spacing.md,
    /** Extra scroll padding so list content clears the tab bar. */
    scrollPaddingBottom: height + spacing.sm,
  };
}
