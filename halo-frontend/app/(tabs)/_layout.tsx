import { Stack, Tabs } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';


export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
  <Stack.Screen name="active" options={{ headerShown: false }} />
  <Stack.Screen name="danger" options={{ headerShown: false }} />
  <Stack.Screen name="witness" options={{ headerShown: false }} />
  <Stack.Screen name="timeline" options={{ headerShown: false }} />
    </Stack>
  );
}