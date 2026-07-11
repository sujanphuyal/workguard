import { StyleSheet, type ViewStyle } from 'react-native';
import { Card, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { triggerSelectionHaptic } from '@/utils/haptics';

interface PixelPanelProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  selected?: boolean;
}

/** MD3 elevated/outlined surface card. */
export function PixelPanel({
  children,
  onPress,
  style,
  elevated = false,
  selected = false,
}: PixelPanelProps) {
  const theme = useTheme<AppTheme>();
  const mode = elevated ? 'elevated' : 'outlined';

  const cardStyle = [
    styles.card,
    selected && { borderColor: theme.colors.primary, borderWidth: 2 },
    style,
  ];

  if (onPress) {
    return (
      <Card
        mode={mode}
        onPress={() => {
          void triggerSelectionHaptic();
          onPress();
        }}
        style={cardStyle}
      >
        <Card.Content style={styles.content}>{children}</Card.Content>
      </Card>
    );
  }

  return (
    <Card mode={mode} style={cardStyle}>
      <Card.Content style={styles.content}>{children}</Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: spacing.xs },
  content: { paddingVertical: spacing.sm },
});
