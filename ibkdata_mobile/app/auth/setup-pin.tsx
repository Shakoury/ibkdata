import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { router } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { authService } from '../../api/auth';
import { extractError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function SetupPinScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirm) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }
    setLoading(true);
    try {
      await authService.setPin(pin);
      if (user) setUser({ ...user, has_pin: true });
      router.replace('/tabs');
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Shield size={32} color={Colors.white} />
        </View>
        <Text style={styles.title}>Set Transaction PIN</Text>
        <Text style={styles.subtitle}>Create a 4-digit PIN to authorize all transactions.</Text>

        <Text style={styles.label}>Enter PIN</Text>
        <TextInput
          style={styles.pinInput}
          placeholder="••••"
          placeholderTextColor={Colors.muted}
          value={pin}
          onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          textAlign="center"
        />

        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          style={styles.pinInput}
          placeholder="••••"
          placeholderTextColor={Colors.muted}
          value={confirm}
          onChangeText={(v) => setConfirm(v.replace(/\D/g, '').slice(0, 4))}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={submit}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Setting PIN...' : 'Set PIN & Continue'}</Text>
        </TouchableOpacity>

        <Text style={styles.note}>Your PIN is required for every transaction. Keep it safe.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  iconBox: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.muted, marginBottom: 32, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.ink, marginBottom: 8, marginTop: 16 },
  pinInput: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 18, fontSize: 24, color: Colors.ink,
    letterSpacing: 16,
  },
  btn: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 32,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  note: { color: Colors.muted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
