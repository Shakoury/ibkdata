import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { transactionService } from '../../api/transactions';
import { extractError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
const amounts = [100, 200, 500, 1000, 2000, 5000];

const formatNaira = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₦${num.toLocaleString('en-NG')}`;
};

export default function BuyAirtimeScreen() {
  const user = useAuthStore((s) => s.user);
  const [phone, setPhone] = useState(user?.phone || '');
  const [network, setNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'form' | 'pin' | 'success'>('form');
  const [loading, setLoading] = useState(false);

  const balance = parseFloat(user?.balance || '0');

  const proceed = () => {
    if (!phone || phone.length < 11) { Alert.alert('Error', 'Enter a valid 11-digit phone number'); return; }
    if (!network) { Alert.alert('Error', 'Select a network'); return; }
    if (!amount || parseFloat(amount) < 50) { Alert.alert('Error', 'Minimum amount is ₦50'); return; }
    if (parseFloat(amount) > 100000) { Alert.alert('Error', 'Maximum amount is ₦100,000'); return; }
    if (parseFloat(amount) > balance) { Alert.alert('Insufficient Balance', 'Please fund your wallet first'); return; }
    setStep('pin');
  };

  const confirm = async () => {
    if (pin.length !== 4) { Alert.alert('Error', 'Enter your 4-digit PIN'); return; }
    setLoading(true);
    try {
      await transactionService.buyAirtime({ phone, network, amount: parseFloat(amount), pin });
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
        <Text style={styles.successTitle}>Airtime Sent!</Text>
        <Text style={styles.successSub}>{formatNaira(amount)} airtime sent to {phone}</Text>
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
          <Text style={styles.subtitle}>Confirm {formatNaira(amount)} airtime to {phone} ({network})</Text>
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
            autoFocus
          />
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
        <Text style={styles.title}>Buy Airtime</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>{formatNaira(balance)}</Text>
        </View>

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="08012345678"
          placeholderTextColor={Colors.muted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={11}
        />

        <Text style={styles.label}>Network</Text>
        <View style={styles.networkRow}>
          {networks.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.networkBtn, network === n && styles.networkBtnActive]}
              onPress={() => setNetwork(n)}
            >
              <Text style={[styles.networkText, network === n && styles.networkTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          placeholderTextColor={Colors.muted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <View style={styles.amountGrid}>
          {amounts.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.amountBtn, amount === String(a) && styles.amountBtnActive]}
              onPress={() => setAmount(String(a))}
            >
              <Text style={[styles.amountText, amount === String(a) && styles.amountTextActive]}>
                ₦{a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
  networkRow: { flexDirection: 'row', gap: 10 },
  networkBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center' },
  networkBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  networkText: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  networkTextActive: { color: Colors.white },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  amountBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  amountBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  amountText: { fontSize: 13, fontWeight: '500', color: Colors.ink },
  amountTextActive: { color: Colors.white },
  btn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  pinInput: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 18, fontSize: 28, color: Colors.ink, letterSpacing: 16, marginBottom: 24 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: `${Colors.success}20`, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successEmoji: { fontSize: 32, color: Colors.success },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  successSub: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginBottom: 32 },
});
