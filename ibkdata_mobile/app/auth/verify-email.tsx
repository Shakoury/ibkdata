import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { authService } from '../../api/auth';
import { extractError } from '../../api/client';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const verify = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyEmail(email || '', code);
      Alert.alert('Success', 'Email verified! You can now sign in.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') }
      ]);
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await authService.resendVerification(email || '');
      Alert.alert('Sent', 'Verification code resent. Check your email.');
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <TextInput
          style={styles.codeInput}
          placeholder="000000"
          placeholderTextColor={Colors.muted}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={verify}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify Email'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resend} disabled={resending} style={styles.resendBtn}>
          <Text style={styles.resendText}>{resending ? 'Sending...' : 'Resend code'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 100, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.ink, marginBottom: 10 },
  subtitle: { fontSize: 14, color: Colors.muted, marginBottom: 32, lineHeight: 22 },
  email: { color: Colors.ink, fontWeight: '600' },
  codeInput: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 18, fontSize: 28, color: Colors.ink,
    letterSpacing: 12, marginBottom: 24,
  },
  btn: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  resendBtn: { alignItems: 'center', marginTop: 20 },
  resendText: { color: Colors.accent, fontWeight: '500', fontSize: 14 },
});
