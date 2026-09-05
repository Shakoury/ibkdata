import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { api, extractError } from '../../api/client';

export default function ChangePinScreen() {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (oldPin.length !== 4 || newPin.length !== 4) { Alert.alert('Error', 'PIN must be 4 digits'); return; }
    if (newPin !== confirmPin) { Alert.alert('Error', 'PINs do not match'); return; }
    setLoading(true);
    try {
      await api.post('/users/pin/change/', { old_pin: oldPin, new_pin: newPin });
      Alert.alert('Success', 'PIN changed', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) { Alert.alert('Error', extractError(err)); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><ArrowLeft size={22} color={Colors.ink} /></TouchableOpacity>
        <Text style={styles.title}>Change PIN</Text>
        {[['Current PIN', oldPin, setOldPin], ['New PIN', newPin, setNewPin], ['Confirm PIN', confirmPin, setConfirmPin]].map(([label, value, setter]) => (
          <View key={label as string}>
            <Text style={styles.label}>{label as string}</Text>
            <TextInput style={styles.pinInput} placeholder="••••" placeholderTextColor={Colors.muted} value={value as string} onChangeText={(v) => (setter as any)(v.replace(/\D/g, '').slice(0, 4))} keyboardType="numeric" secureTextEntry maxLength={4} textAlign="center" />
          </View>
        ))}
        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={save} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Saving...' : 'Change PIN'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.ink, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.ink, marginBottom: 8, marginTop: 20 },
  pinInput: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 18, fontSize: 28, color: Colors.ink, letterSpacing: 16 },
  btn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
});
