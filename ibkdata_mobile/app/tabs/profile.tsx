import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { User, Lock, Key, LogOut, ChevronRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../api/auth';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
    onSuccess: (data: any) => setUser(data),
  });

  const displayUser = profile ?? user;
  const firstName = displayUser?.first_name ?? '';
  const lastName = displayUser?.last_name ?? '';
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        }
      }
    ]);
  };

  const items = [
    { icon: User, label: 'Edit Profile', onPress: () => router.push('/screens/edit-profile') },
    { icon: Lock, label: 'Change Password', onPress: () => router.push('/screens/change-password') },
    { icon: Key, label: 'Transaction PIN', onPress: () => router.push('/screens/change-pin') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      {/* User card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '??'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{firstName} {lastName}</Text>
          <Text style={styles.email} numberOfLines={1}>{displayUser?.email}</Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, index === items.length - 1 && styles.menuItemLast]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <item.icon size={20} color={Colors.muted} />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <ChevronRight size={18} color={Colors.muted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <LogOut size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.ink, marginBottom: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: `${Colors.accent}20`, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.accent },
  name: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  email: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  menu: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuItemLast: { borderBottomWidth: 0 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: Colors.ink, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  logoutText: { fontSize: 15, color: Colors.error, fontWeight: '600' },
});
