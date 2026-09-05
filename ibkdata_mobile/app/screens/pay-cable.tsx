import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { transactionService } from '../../api/transactions';
import { extractError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

const formatNaira = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₦${num.toLocaleString('en-NG')}`;
};

export default function PayCableScreen() {
  const user = useAuthStore((s) => s.user);
  const [provider, setProvider] = useState<any>(null);
  const [pkg, setPkg] = useState<any>(null);
  const [smartCard, setSmartCard] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'form' | 'pin' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const balance = parseFloat(user?.balance || '0');

  const { data: providers, isLoading } = useQuery({
    queryKey: ['cable-providers'],
    queryFn: transactionService.getCableTVProviders,
  });

  const packages = provider?.packages ?? [];

  const proceed = () => {
    if (!provider) { Alert.alert('Error', 'Select a provider'); return; }
    if (!pkg) { Alert.alert('Error', 'Select a package'); return; }
    if (!smartCard) { Alert.alert('Error', 'Enter smartcard/IUC number'); return; }
    if (pkg.amount > balance) { Alert.alert('Insufficient Balance', 'Please fund your wallet first'); return; }
    setStep('pin');
  };

  const confirm = async () => {
    if (pin.length !== 4) { Alert.alert('Error', 'Enter your 4-digit PIN'); return; }
    setLoading(true);
    try {
      await transactionService.payCable({
        provider_code: provider.code,
        package_code: pkg.code,
        smart_card_number: smartCard,
        amount: pkg.amount,
        pin,
      });
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
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSub}>{pkg?.name} subscription for {provider?.name}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/tabs')}>
          <Text style={styles.btnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'pin') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.pinContent}>
          <TouchableOpacity onPress={() => setStep('form')} style={styles.back}>
            <ArrowLeft size={22} color={Colors.ink} />
          </TouchableOpacity>
          <Text style={styles.title}>Enter PIN</Text>
          <Text style={styles.subtitle}>Confirm {pkg?.name} ({formatNaira(pkg?.amount)}) for {provider?.name}</Text>
          <TextInput style={styles.pinInput} placeholder="••••" placeholderTextColor={Colors.muted} value={pin} onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))} keyboardType="numeric" secureTextEntry maxLength={4} textAlign="center" autoFocus />
          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={confirm} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'Processing...' : 'Confirm'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Cable TV</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>{formatNaira(balance)}</Text>
        </View>

        <Text style={styles.label}>Provider</Text>
        {isLoading ? <ActivityIndicator color={Colors.accent} /> : (
          <View style={styles.providerRow}>
            {(providers ?? []).map((p: any) => (
              <TouchableOpacity key={p.id} style={[styles.providerBtn, provider?.id === p.id && styles.providerBtnActive]} onPress={() => { setProvider(p); setPkg(null); }}>
                <Text style={[styles.providerText, provider?.id === p.id && styles.providerTextActive]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Smartcard/IUC Number</Text>
        <TextInput style={styles.input} placeholder="Enter smartcard number" placeholderTextColor={Colors.muted} value={smartCard} onChangeText={setSmartCard} keyboardType="numeric" />

        {provider && (
          <>
            <Text style={styles.label}>Package</Text>
            <View style={styles.packageList}>
              {packages.map((p: any) => (
                <TouchableOpacity key={p.id} style={[styles.packageBtn, pkg?.id === p.id && styles.packageBtnActive]} onPress={() => setPkg(p)}>
                  <Text style={[styles.packageName, pkg?.id === p.id && styles.packageTextActive]}>{p.name}</Text>
                  <Text style={[styles.packagePrice, pkg?.id === p.id && styles.packageTextActive]}>{formatNaira(p.amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.btn} onPress={proceed}>
          <Text style={styles.btnText}>Proceed</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  pinContent: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  back: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.ink, marginBottom: 20 },
  subtitle: { fontSize: 14, color: Colors.muted, marginBottom: 24, lineHeight: 22 },
  balanceCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  balanceLabel: { fontSize: 12, color: Colors.muted, marginBottom: 4 },
  balanceAmount: { fontSize: 20, fontWeight: '700', color: Colors.ink },
  label: { fontSize: 13, fontWeight: '500', color: Colors.ink, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.ink },
  providerRow: { flexDirection: 'row', gap: 10 },
  providerBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center' },
  providerBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  providerText: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  providerTextActive: { color: Colors.white },
  packageList: { gap: 8 },
  packageBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  packageBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  packageName: { fontSize: 14, fontWeight: '500', color: Colors.ink },
  packagePrice: { fontSize: 14, fontWeight: '700', color: Colors.accent },
  packageTextActive: { color: Colors.white },
  btn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  pinInput: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 18, fontSize: 28, color: Colors.ink, letterSpacing: 16, marginBottom: 24 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: `${Colors.success}20`, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successEmoji: { fontSize: 32, color: Colors.success },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  successSub: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginBottom: 32 },
});
