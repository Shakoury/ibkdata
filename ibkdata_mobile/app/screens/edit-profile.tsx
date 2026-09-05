import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { api, extractError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function EditProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!firstName || !lastName) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setLoading(true);
    try {
      const { data } = await api.patch('/users/me/', { first_name: firstName, last_name: lastName, phone });
      setUser(data);
      Alert.alert('Success', 'Profile updated', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) { Alert.alert('Error', extractError(err)); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><ArrowLeft size={22} color={Colors.ink} /></TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        {[['First Name', firstName, setFirstName, 'default'], ['Last Name', lastName, setLastName, 'default'], ['Phone', phone, setPhone, 'phone-pad']].map(([label, value, setter, keyboard]) => (
          <View key={label as string}>
            <Text style={styles.label}>{label as string}</Text>
            <TextInput style={styles.input} placeholder={label as string} placeholderTextColor={Colors.muted} value={value as string} onChangeText={setter as any} keyboardType={keyboard as any} />
          </View>
        ))}
        <Text style={styles.label}>Email (cannot be changed)</Text>
        <View style={styles.emailBox}><Text style={styles.emailText}>{user?.email}</Text></View>
        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={save} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
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
  emailBox: { backgroundColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  emailText: { fontSize: 15, color: Colors.muted },
  btn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
});
