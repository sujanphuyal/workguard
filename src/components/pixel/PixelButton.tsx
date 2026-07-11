import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

import { spacing } from '@/theme/tokens';
import { triggerImpactHaptic } from '@/utils/haptics';

interface PixelButtonProps {
  children: string;
  onPress?: () => void;
  mode?: 'contained' | 'outlined' | 'text' | 'contained-tonal' | 'elevated';
  loading?: boolean;
  disabled?: boolean;
  style?: object;
  icon?: string;
}

/** MD3 button with consistent sizing and haptic feedback. */
export function PixelButton({
  children,
  onPress,
  mode = 'contained',
  loading = false,
  disabled = false,
  style,
  icon,
}: PixelButtonProps) {
  const handlePress = () => {
    void triggerImpactHaptic();
    onPress?.();
  };

  return (
    <Button
      mode={mode}
      icon={icon}
      onPress={handlePress}
      loading={loading}
      disabled={disabled || loading}
      style={[styles.button, style]}
      contentStyle={styles.content}
    >
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: { marginVertical: spacing.xs },
  content: { minHeight: 40, paddingVertical: spacing.xs },
});
