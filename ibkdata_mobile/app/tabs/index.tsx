import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Phone, Wifi, Zap, Tv, Plus, Eye, EyeOff, ArrowUpRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../api/auth';
import { transactionService } from '../../api/transactions';

const formatNaira = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
};

const services = [
  { label: 'Airtime', icon: Phone, route: '/screens/buy-airtime' },
  { label: 'Data', icon: Wifi, route: '/screens/buy-data' },
  { label: 'Electricity', icon: Zap, route: '/screens/pay-electricity' },
  { label: 'Cable TV', icon: Tv, route: '/screens/pay-cable' },
];

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
    onSuccess: (data: any) => setUser(data),
  });

  const { data: txData, refetch: refetchTx } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionService.getAll({ page: 1 }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchTx()]);
    setRefreshing(false);
  }, []);

  const balance = parseFloat(profile?.balance ?? user?.balance ?? '0');
  const firstName = profile?.first_name ?? user?.first_name ?? '';
  const lastName = profile?.last_name ?? user?.last_name ?? '';
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
  const transactions = txData?.results ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.name} numberOfLines={1}>{firstName} {lastName}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => router.push('/tabs/profile')}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <TouchableOpacity onPress={() => setShowBalance(!showBalance)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {showBalance
              ? <EyeOff size={18} color="rgba(255,255,255,0.6)" />
              : <Eye size={18} color="rgba(255,255,255,0.6)" />
            }
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceAmount}>
          {showBalance ? formatNaira(balance) : '₦ ****'}
        </Text>
        <TouchableOpacity style={styles.fundBtn} onPress={() => router.push('/screens/fund-wallet')}>
          <Plus size={16} color={Colors.white} />
          <Text style={styles.fundBtnText}>Fund Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Service Icons */}
      <View style={styles.servicesGrid}>
        {services.map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.serviceCard}
            onPress={() => router.push(s.route as any)}
            activeOpacity={0.7}
          >
            <View style={styles.serviceIcon}>
              <s.icon size={20} color={Colors.accent} />
            </View>
            <Text style={styles.serviceLabel} numberOfLines={1}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fund Wallet Banner */}
      <TouchableOpacity style={styles.fundBanner} onPress={() => router.push('/screens/fund-wallet')} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fundBannerTitle}>Fund Wallet</Text>
          <Text style={styles.fundBannerSub} numberOfLines={2}>Transfer to our bank account and submit for confirmation</Text>
        </View>
        <ArrowUpRight size={20} color={Colors.accent} />
      </TouchableOpacity>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/tabs/transactions')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          transactions.slice(0, 5).map((tx: any) => (
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
                <Text style={[styles.txAmount, tx.type === 'FUNDING' && styles.txCredit]}>
                  {tx.type === 'FUNDING' ? '+' : '-'}{formatNaira(tx.amount)}
                </Text>
                <Text style={[styles.txStatus, tx.status === 'SUCCESS' ? styles.success : styles.pending]}>
                  {tx.status?.toLowerCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  welcome: { fontSize: 12, color: Colors.muted, marginBottom: 2 },
  name: { fontSize: 18, fontWeight: '700', color: Colors.ink, maxWidth: 220 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  balanceCard: {
    marginHorizontal: 20, borderRadius: 16, backgroundColor: Colors.ink,
    padding: 20, marginBottom: 20,
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  balanceAmount: { fontSize: 32, fontWeight: '700', color: Colors.white, marginBottom: 20 },
  fundBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  fundBtnText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
  servicesGrid: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16,
  },
  serviceCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14,
    paddingVertical: 16, paddingHorizontal: 6, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  serviceIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${Colors.accent}15`, justifyContent: 'center', alignItems: 'center',
  },
  serviceLabel: { fontSize: 11, fontWeight: '500', color: Colors.ink, textAlign: 'center' },
  fundBanner: {
    marginHorizontal: 20, backgroundColor: Colors.white, borderRadius: 14,
    padding: 16, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: 24, gap: 12,
  },
  fundBannerTitle: { fontSize: 14, fontWeight: '600', color: Colors.ink, marginBottom: 4 },
  fundBannerSub: { fontSize: 12, color: Colors.muted, lineHeight: 18 },
  section: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.ink },
  seeAll: { fontSize: 13, color: Colors.accent, fontWeight: '500' },
  emptyText: { color: Colors.muted, textAlign: 'center', paddingVertical: 24, fontSize: 14 },
  txItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  txType: { fontSize: 14, fontWeight: '500', color: Colors.ink, textTransform: 'capitalize' },
  txDate: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  txCredit: { color: Colors.success },
  txStatus: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  success: { color: Colors.success },
  pending: { color: Colors.muted },
});
