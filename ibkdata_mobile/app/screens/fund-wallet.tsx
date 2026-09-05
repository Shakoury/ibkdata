import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Copy } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../../constants/colors';
import { walletService } from '../../api/wallet';
import { extractError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function FundWalletScreen() {
  const user = useAuthStore((s) => s.user);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['virtual-account'],
    queryFn: walletService.getVirtualAccount,
  });

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Account number copied to clipboard');
  };

  const submit = async () => {
    if (!amount || parseFloat(amount) < 100) { Alert.alert('Error', 'Minimum amount is ₦100'); return; }
    if (!phone || phone.length < 11) { Alert.alert('Error', 'Enter a valid phone number'); return; }
    setLoading(true);
    try {
      await walletService.submitFundRequest({ amount: parseFloat(amount), phone, reference });
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Error', extractError(err));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.successIcon}><Text style={styles.successEmoji}>✓</Text></View>
        <Text style={styles.successTitle}>Request Submitted!</Text>
        <Text style={styles.successSub}>Your fund request has been submitted. Funds will reflect within 30 minutes after confirmation.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/tabs')}>
          <Text style={styles.btnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Fund Wallet</Text>

        {/* Virtual Account */}
        <View style={styles.accountCard}>
          {accountLoading ? (
            <ActivityIndicator color={Colors.accent} />
          ) : account ? (
            <>
              <Text style={styles.accountTitle}>Transfer to this account</Text>
              <View style={styles.accountRow}>
                <View>
                  <Text style={styles.accountBank}>{account.bank_name}</Text>
                  <Text style={styles.accountNumber}>{account.account_number}</Text>
                  <Text style={styles.accountName}>{account.account_name}</Text>
                </View>
                <TouchableOpacity onPress={() => copyToClipboard(account.account_number)}>
                  <Copy size={20} color={Colors.accent} />
                </TouchableOpacity>
              </View>
              <Text style={styles.accountNote}>{account.message}</Text>
            </>
          ) : (
            <Text style={styles.accountNote}>Virtual account not available. Contact support.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Submit Transfer Confirmation</Text>

        <Text style={styles.label}>Amount Transferred</Text>
        <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={Colors.muted} value={amount} onChangeText={setAmount} keyboardType="numeric" />

        <Text style={styles.label}>Sender Phone Number</Text>
        <TextInput style={styles.input} placeholder="Phone for identification" placeholderTextColor={Colors.muted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={11} />

        <Text style={styles.label}>Transaction Reference (optional)</Text>
        <TextInput style={styles.input} placeholder="Reference" placeholderTextColor={Colors.muted} value={reference} onChangeText={setReference} />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submit} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Submitting...' : 'Submit Fund Request'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.ink, marginBottom: 20 },
  accountCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  accountTitle: { fontSize: 13, color: Colors.muted, marginBottom: 12, fontWeight: '500' },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountBank: { fontSize: 13, color: Colors.muted, marginBottom: 4 },
  accountNumber: { fontSize: 22, fontWeight: '700', color: Colors.ink, marginBottom: 4 },
  accountName: { fontSize: 13, color: Colors.muted },
  accountNote: { fontSize: 12, color: Colors.muted, marginTop: 12, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.ink, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.ink, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.ink },
  btn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: `${Colors.success}20`, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successEmoji: { fontSize: 32, color: Colors.success },
  successTitle: { fontSize: 24, fontWeight: '700', color: Colors.ink, marginBottom: 8 },
  successSub: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
});
