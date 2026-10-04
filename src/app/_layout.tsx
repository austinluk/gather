import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/lib/auth';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Caveat_700Bold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Tab routes swap instantly (no slide) */}
          <Stack.Screen name="home" options={{ animation: 'none' }} />
          <Stack.Screen name="explore" options={{ animation: 'none' }} />
          <Stack.Screen name="events" options={{ animation: 'none' }} />
          <Stack.Screen name="alerts" options={{ animation: 'none' }} />
          <Stack.Screen name="profile" options={{ animation: 'none' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
