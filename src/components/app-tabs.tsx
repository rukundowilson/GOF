import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor="#FFFFFF"
      indicatorColor="#EAF4E6"
      iconColor={{ default: '#9AA39C', selected: '#5DAC2C' }}
      rippleColor="#EAF4E6"
      shadowColor="#DCE6D9"
      labelVisibilityMode="labeled"
      labelStyle={{
        default: { color: '#737B75' },
        selected: { color: '#467232', fontWeight: '700' },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Services</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
          md="apps"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
