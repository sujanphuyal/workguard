import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

interface ShowMoreButtonProps {
  remaining: number;
  hasMore: boolean;
  canShowLess: boolean;
  onShowMore: () => void;
  onShowLess: () => void;
}

export function ShowMoreButton({
  remaining,
  hasMore,
  canShowLess,
  onShowMore,
  onShowLess,
}: ShowMoreButtonProps) {
  if (!hasMore && !canShowLess) return null;

  return (
    <View style={styles.row}>
      {canShowLess ? (
        <Pressable style={styles.button} onPress={onShowLess}>
          <Icon source="chevron-up" size={18} />
          <Text variant="bodyMedium" style={styles.label}>
            Show less
          </Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      {hasMore ? (
        <Pressable style={styles.button} onPress={onShowMore}>
          <Text variant="bodyMedium" style={styles.label}>
            Show more ({remaining} remaining)
          </Text>
          <Icon source="chevron-down" size={18} />
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: { fontWeight: '500' },
  placeholder: { flex: 1 },
});
