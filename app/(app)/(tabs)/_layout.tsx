import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { colors } from '@/theme';
import type { IconName } from '@/utils/icons';

function tabIcon(name: IconName) {
  // RN 0.88: ColorValue pode ser null ou number, e o Ionicons só aceita string ou cor nativa.
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons
      name={name}
      size={size}
      color={color == null || typeof color === 'number' ? undefined : color}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Notas', tabBarIcon: tabIcon('receipt') }}
      />
      <Tabs.Screen
        name="scan"
        options={{ title: 'Escanear', tabBarIcon: tabIcon('camera') }}
      />
      <Tabs.Screen
        name="summary"
        options={{ title: 'Resumo', tabBarIcon: tabIcon('pie-chart') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person') }}
      />
    </Tabs>
  );
}
