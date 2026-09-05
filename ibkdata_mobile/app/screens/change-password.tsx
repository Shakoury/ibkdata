import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { api, extractError } from '../../api/client';

export default function ChangePasswordScreen() {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!oldPass || !newPass) { Alert.alert('Error', 'Fill all fields'); return; }
    if (newPass.length < 8) { Alert.alert('Error', 'Min 8 characters'); return; }
    if (newPass !== confirm) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/users/auth/change-password/', { old_password: oldPass, new_password: newPass });
      Alert.alert('Success', 'Password changed', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) { Alert.alert('Error', extractError(err)); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><ArrowLeft size={22} color={Colors.ink} /></TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        {[['Current Password', oldPass, setOldPass], ['New Password', newPass, setNewPass], ['Confirm New Password', confirm, setConfirm]].map(([label, value, setter]) => (
          <View key={label as string}>
            <Text style={styles.label}>{label as string}</Text>
            <TextInput style={styles.input} placeholder={label as string} placeholderTextColor={Colors.muted} value={value as string} onChangeText={setter as any} secureTextEntry />
          </View>
        ))}
        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={save} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Saving...' : 'Change Password'}</Text>
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
  label: { fontSize: 13, fontWeight: '500', color: Colors.ink, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.ink },
  btn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
});
