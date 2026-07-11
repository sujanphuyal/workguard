import { View, type ViewProps } from 'react-native';

type BootVariant = 'default' | 'subtle' | 'up' | 'stagger';

interface BootInViewProps extends ViewProps {
  variant?: BootVariant;
  index?: number;
  children: React.ReactNode;
}

/** Stable passthrough — avoids reanimated enter animations on every mount/update. */
export function BootInView({ children, style, ...rest }: BootInViewProps) {
  return (
    <View style={style} {...rest}>
      {children}
    </View>
  );
}
