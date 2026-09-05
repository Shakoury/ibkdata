import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { tokenStorage } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { authService } from '../api/auth';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 200,
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="auth" />
          <Stack.Screen name="tabs" options={{ animation: 'none' }} />
          <Stack.Screen name="screens" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
