import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { tokenStorage } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { authService } from '../api/auth';
import { Colors } from '../constants/colors';

export default function Index() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const check = async () => {
      const token = await tokenStorage.getAccess();
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      try {
        const user = await authService.getProfile();
        setUser(user);
        if (!user.is_verified) {
          router.replace('/auth/verify-email');
        } else if (!user.has_pin) {
          router.replace('/auth/setup-pin');
        } else {
          router.replace('/tabs');
        }
      } catch {
        router.replace('/auth/login');
      }
    };
    check();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.cream }}>
      <ActivityIndicator color={Colors.accent} size="large" />
    </View>
  );
}
