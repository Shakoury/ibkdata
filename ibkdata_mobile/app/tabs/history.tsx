import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { walletService } from '../../api/wallet';

const formatNaira = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
};

export default function HistoryScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['wallet-history'],
    queryFn: walletService.getHistory,
  });

  const history = data?.results ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet History</Text>
      <Text style={styles.subtitle}>All credits and debits on your wallet</Text>
      {isLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : history.length === 0 ? (
        <Text style={styles.empty}>No wallet transactions yet</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {history.map((tx: any) => (
            <View key={tx.id} style={styles.item}>
              <View>
                <Text style={styles.desc}>{tx.description}</Text>
                <Text style={styles.date}>{new Date(tx.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.right}>
                <Text style={[styles.amount, tx.transaction_type === 'CREDIT' ? styles.credit : styles.debit]}>
                  {tx.transaction_type === 'CREDIT' ? '+' : '-'}{formatNaira(tx.amount)}
                </Text>
                <Text style={styles.bal}>Bal: {formatNaira(tx.balance_after)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.ink, paddingHorizontal: 20, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.muted, paddingHorizontal: 20, marginBottom: 24 },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 8 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  desc: { fontSize: 14, fontWeight: '500', color: Colors.ink },
  date: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 14, fontWeight: '600' },
  credit: { color: Colors.success },
  debit: { color: Colors.error },
  bal: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 60, fontSize: 14 },
});
