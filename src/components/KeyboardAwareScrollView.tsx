import { KeyboardAvoidingView, Platform, ScrollView, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  /** Extra offset when a stack header is shown above the scroll area */
  includeHeaderOffset?: boolean;
  keyboardVerticalOffset?: number;
}

export function KeyboardAwareScrollView({
  children,
  includeHeaderOffset = false,
  keyboardVerticalOffset,
  contentContainerStyle,
  ...scrollProps
}: KeyboardAwareScrollViewProps) {
  const insets = useSafeAreaInsets();
  const offset =
    keyboardVerticalOffset ?? insets.top + (includeHeaderOffset ? 56 : 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={contentContainerStyle}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
