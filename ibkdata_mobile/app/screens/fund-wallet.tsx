import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Copy } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../../constants/colors';
import { walletService } from '../../api/wallet';

export default function FundWalletScreen() {
  const { data: account, isLoading: accountLoading, refetch, isFetching } = useQuery({
    queryKey: ['virtual-account'],
    queryFn: walletService.getVirtualAccount,
  });

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Account number copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <ArrowLeft size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Fund Wallet</Text>

        <View style={styles.accountCard}>
          {accountLoading ? (
            <ActivityIndicator color={Colors.accent} />
          ) : account?.account_number ? (
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
              <Text style={styles.accountNote}>
                Transfer any amount to this account. Your wallet is credited automatically, usually within a few minutes.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.accountNote}>Your account is being set up. This can take a minute.</Text>
              <TouchableOpacity onPress={() => refetch()} disabled={isFetching}>
                <Text style={[styles.accountNote, { color: Colors.accent, fontWeight: '600' }]}>
                  {isFetching ? 'Checking...' : 'Check again'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
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
});
