import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { authService } from '../../api/auth';
import { extractError } from '../../api/client';

export default function RegisterScreen() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.phone || !form.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authService.register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
      });
      router.replace({ pathname: '/auth/verify-email', params: { email: form.email.trim().toLowerCase() } });
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={22} color={Colors.ink} />
        </TouchableOpacity>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join IBKDATA to start topping up</Text>

        {[
          { key: 'first_name', label: 'First Name', placeholder: 'First name' },
          { key: 'last_name', label: 'Last Name', placeholder: 'Last name' },
          { key: 'email', label: 'Email', placeholder: 'Email address', keyboard: 'email-address' },
          { key: 'phone', label: 'Phone Number', placeholder: '08012345678', keyboard: 'phone-pad' },
          { key: 'password', label: 'Password', placeholder: 'Min 8 characters', secure: true },
          { key: 'confirm', label: 'Confirm Password', placeholder: 'Repeat password', secure: true },
        ].map((field) => (
          <View key={field.key}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={Colors.muted}
              value={(form as any)[field.key]}
              onChangeText={(v) => update(field.key, v)}
              keyboardType={(field.keyboard as any) || 'default'}
              secureTextEntry={field.secure}
              autoCapitalize="none"
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={register}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.mutedText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/auth/login')}>
            <Text style={styles.linkText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.ink, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.muted, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.ink, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.ink,
  },
  btn: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 28,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  mutedText: { color: Colors.muted, fontSize: 14 },
  linkText: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
});
