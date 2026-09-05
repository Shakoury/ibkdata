import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { authService } from '../../api/auth';
import { extractError } from '../../api/client';

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!email) { Alert.alert('Error', 'Enter your email address'); return; }
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      setStep('code');
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = () => {
    if (code.length !== 6) { Alert.alert('Error', 'Enter the 6-digit code'); return; }
    setStep('password');
  };

  const resetPassword = async () => {
    if (newPassword.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      await authService.resetPassword({ email: email.trim().toLowerCase(), code, new_password: newPassword });
      setStep('success');
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.successIcon}><Text style={styles.successEmoji}>✓</Text></View>
        <Text style={styles.title}>Password Reset!</Text>
        <Text style={styles.subtitle}>Your password has been reset successfully. You can now sign in.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/auth/login')}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => step === 'email' ? router.back() : setStep(step === 'code' ? 'email' : 'code')} style={styles.back}>
          <ArrowLeft size={22} color={Colors.ink} />
        </TouchableOpacity>

        {step === 'email' && (
          <>
            <Text style={styles.title}>Forgot password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>
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
            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={sendCode} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'code' && (
          <>
            <Text style={styles.title}>Enter reset code</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.highlight}>{email}</Text>
            </Text>
            <Text style={styles.label}>Reset Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="000000"
              placeholderTextColor={Colors.muted}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
              autoFocus
            />
            <TouchableOpacity style={styles.btn} onPress={verifyCode}>
              <Text style={styles.btnText}>Verify Code</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sendCode} style={styles.resendBtn}>
              <Text style={styles.resendText}>Resend code</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'password' && (
          <>
            <Text style={styles.title}>New password</Text>
            <Text style={styles.subtitle}>Enter your new password below</Text>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 8 characters"
              placeholderTextColor={Colors.muted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Repeat new password"
              placeholderTextColor={Colors.muted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={resetPassword} disabled={loading}>
              <Text style={styles.btnText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.muted, marginBottom: 32, lineHeight: 22 },
  highlight: { color: Colors.ink, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '500', color: Colors.ink, marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: Colors.ink,
  },
  codeInput: { fontSize: 28, letterSpacing: 12 },
  btn: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  resendBtn: { alignItems: 'center', marginTop: 16 },
  resendText: { color: Colors.accent, fontWeight: '500', fontSize: 14 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: `${Colors.success}20`, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successEmoji: { fontSize: 32, color: Colors.success },
});
