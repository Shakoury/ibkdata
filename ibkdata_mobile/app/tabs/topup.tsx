import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Phone, Wifi, Zap, Tv, Wallet } from 'lucide-react-native';
import { Colors } from '../../constants/colors';

const services = [
  { id: 'airtime', label: 'Buy Airtime', desc: 'MTN, Glo, Airtel, 9mobile', icon: Phone, route: '/screens/buy-airtime' },
  { id: 'data', label: 'Buy Data', desc: 'All networks', icon: Wifi, route: '/screens/buy-data' },
  { id: 'electricity', label: 'Pay Electricity', desc: 'All DISCOs', icon: Zap, route: '/screens/pay-electricity' },
  { id: 'cable', label: 'Cable TV', desc: 'DSTV, GOTV, Startimes', icon: Tv, route: '/screens/pay-cable' },
  { id: 'fund', label: 'Fund Wallet', desc: 'Add money to your wallet', icon: Wallet, route: '/screens/fund-wallet' },
];

export default function TopUpScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Up</Text>
      <Text style={styles.subtitle}>Choose a service</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {services.map((s) => (
          <TouchableOpacity key={s.id} style={styles.card} onPress={() => router.push(s.route as any)}>
            <View style={styles.iconBox}>
              <s.icon size={24} color={Colors.accent} />
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>{s.label}</Text>
              <Text style={styles.desc}>{s.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.ink, paddingHorizontal: 20, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.muted, paddingHorizontal: 20, marginBottom: 24 },
  list: { paddingHorizontal: 20, gap: 12, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 16, gap: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${Colors.accent}15`, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.ink, marginBottom: 2, flexShrink: 1 },
  desc: { fontSize: 13, color: Colors.muted, flexShrink: 1 },
});
