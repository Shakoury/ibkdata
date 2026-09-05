import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { transactionService } from '../../api/transactions';

const formatNaira = (v: any) => `₦${parseFloat(v).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useQuery({ queryKey: ['transactions'], queryFn: () => transactionService.getAll() });
  const tx = data?.results?.find((t: any) => String(t.id) === id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}><ArrowLeft size={22} color={Colors.ink} /></TouchableOpacity>
      <Text style={styles.title}>Transaction Details</Text>
      {tx ? (
        <>
          <View style={styles.card}>
            <Text style={styles.amount}>{tx.type === 'FUNDING' ? '+' : '-'}{formatNaira(tx.amount)}</Text>
            <Text style={styles.type}>{tx.type?.replace('_', ' ').toLowerCase()}</Text>
            <Text style={[styles.status, { color: tx.status === 'SUCCESS' ? Colors.success : Colors.muted }]}>{tx.status?.toLowerCase()}</Text>
          </View>
          <View style={styles.detailsCard}>
            {[['ID', tx.id], ['Type', tx.type], ['Amount', formatNaira(tx.amount)], ['Status', tx.status], ['Phone', tx.phone || '-'], ['Network', tx.network || '-'], ['Date', new Date(tx.created_at).toLocaleString()], ['Reference', tx.reference || '-']].map(([l, v]) => (
              <View key={l} style={styles.row}>
                <Text style={styles.label}>{l}</Text>
                <Text style={styles.value}>{v}</Text>
              </View>
            ))}
          </View>
        </>
      ) : <Text style={styles.empty}>Transaction not found</Text>}
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/tabs')}><Text style={styles.btnText}>Back to Home</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.ink, marginBottom: 20 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  amount: { fontSize: 32, fontWeight: '700', color: Colors.ink },
  type: { fontSize: 14, color: Colors.muted, marginTop: 4, textTransform: 'capitalize' },
  status: { fontSize: 13, fontWeight: '600', marginTop: 8, textTransform: 'capitalize' },
  detailsCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { fontSize: 13, color: Colors.muted },
  value: { fontSize: 13, color: Colors.ink, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  btn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 40 },
});
