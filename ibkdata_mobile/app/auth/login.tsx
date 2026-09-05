import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { router } from 'expo-router';
import { Smartphone } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { authService } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { extractError } from '../../api/client';

export default function LoginScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await authService.login(email.trim().toLowerCase(), password);
      setUser(user);
      if (!user.is_verified) {
        router.replace({ pathname: '/auth/verify-email', params: { email: user.email } });
      } else if (!user.has_pin) {
        router.replace('/auth/setup-pin');
      } else {
        router.replace('/tabs');
      }
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.not_verified) {
        router.replace({ pathname: '/auth/verify-email', params: { email: data.email || email } });
      } else {
        Alert.alert('Error', extractError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Smartphone size={20} color={Colors.white} />
          </View>
          <Text style={styles.logoText}>IBKDATA</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your IBKDATA account</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={Colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={Colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={login}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <Text style={styles.mutedText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.linkText}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 40 },
  logoBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 20, fontWeight: '700', color: Colors.ink },
  title: { fontSize: 26, fontWeight: '700', color: Colors.ink, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.muted, marginBottom: 32 },
  form: { gap: 4 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.ink, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.ink,
  },
  forgotText: { color: Colors.accent, fontSize: 13, textAlign: 'right', marginTop: 8, fontWeight: '500' },
  btn: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  mutedText: { color: Colors.muted, fontSize: 14 },
  linkText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
});
