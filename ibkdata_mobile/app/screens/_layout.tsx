import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="buy-airtime" />
      <Stack.Screen name="buy-data" />
      <Stack.Screen name="pay-electricity" />
      <Stack.Screen name="pay-cable" />
      <Stack.Screen name="fund-wallet" />
      <Stack.Screen name="transaction-detail" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="change-pin" />
    </Stack>
  );
}
