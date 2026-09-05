import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { transactionService } from '../../api/transactions';

const formatNaira = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
};

const filters = [
  { label: 'All', value: undefined },
  { label: 'Airtime', value: 'AIRTIME' },
  { label: 'Data', value: 'DATA' },
  { label: 'Electricity', value: 'ELECTRICITY' },
  { label: 'Cable TV', value: 'CABLE_TV' },
];

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['transactions', filter, page],
    queryFn: () => transactionService.getAll({ type: filter, page, page_size: 20 }),
  });

  const transactions = data?.results ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
            onPress={() => { setFilter(f.value); setPage(1); }}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
      ) : transactions.length === 0 ? (
        <Text style={styles.empty}>No transactions found</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {isFetching && <ActivityIndicator color={Colors.accent} style={{ marginBottom: 8 }} />}
          {transactions.map((tx: any) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txItem}
              onPress={() => router.push({ pathname: '/screens/transaction-detail', params: { id: tx.id } })}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.txType} numberOfLines={1}>{tx.type?.replace('_', ' ').toLowerCase()}</Text>
                <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, tx.type === 'FUNDING' && styles.credit]}>
                  {tx.type === 'FUNDING' ? '+' : '-'}{formatNaira(tx.amount)}
                </Text>
                <Text style={[styles.txStatus, tx.status === 'SUCCESS' ? styles.success : tx.status === 'PENDING' ? styles.pending : styles.error]}>
                  {tx.status?.toLowerCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {data?.next && (
            <TouchableOpacity style={styles.loadMore} onPress={() => setPage(page + 1)}>
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  filters: { maxHeight: 50 },
  filtersContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  filterBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterText: { fontSize: 13, color: Colors.ink, fontWeight: '500' },
  filterTextActive: { color: Colors.white },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  txType: { fontSize: 14, fontWeight: '500', color: Colors.ink, textTransform: 'capitalize' },
  txDate: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  credit: { color: Colors.success },
  txStatus: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  success: { color: Colors.success },
  pending: { color: Colors.muted },
  error: { color: Colors.error },
  empty: { color: Colors.muted, textAlign: 'center', marginTop: 60, fontSize: 14 },
  loadMore: { backgroundColor: Colors.white, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginTop: 8 },
  loadMoreText: { color: Colors.ink, fontWeight: '600', fontSize: 14 },
});
