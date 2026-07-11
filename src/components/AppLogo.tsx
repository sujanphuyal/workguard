import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

const logoLight = require('../../assets/images/logo.png');
const logoDark = require('../../assets/images/logo-dark.png');

interface AppLogoProps {
  width?: number;
}

export function AppLogo({ width = 260 }: AppLogoProps) {
  const theme = useTheme();
  const logoSource = theme.dark ? logoDark : logoLight;

  return (
    <View style={styles.wrap}>
      <Image
        source={logoSource}
        style={{ width, height: width }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="WorkGuard — Work smart. Stay compliant."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
