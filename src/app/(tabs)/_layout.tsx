import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

import { TAB_BAR_CONTENT_HEIGHT, useTabBarLayout } from '@/hooks/useTabBarLayout';
import type { AppTheme } from '@/theme';

export default function TabLayout() {
  const theme = useTheme<AppTheme>();
  const { bottomInset, paddingTop, paddingBottom } = useTabBarLayout();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
          paddingTop,
          paddingBottom,
          elevation: 3,
        },
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          title: 'Shifts',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clock-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="roster"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
