import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

type Coordinates = { latitude: number; longitude: number; accuracy: number | null };

export default function SoilLocationMap({ coordinates, onLocate }: { coordinates: Coordinates | null; onLocate: () => void }) {
  return (
    <View style={styles.map}>
      <SymbolView name={{ ios: 'map.fill', android: 'map', web: 'map' }} tintColor="#7A8C80" size={28} />
      <Text style={styles.text}>{coordinates ? 'Current location is ready' : 'Your current location will appear here'}</Text>
      {coordinates ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`)}
          style={styles.button}>
          <Text style={styles.buttonText}>Open in Google Maps</Text>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="button" onPress={onLocate} style={styles.button}>
          <Text style={styles.buttonText}>Use current location</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: 190, backgroundColor: '#F1F5F2', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  text: { color: '#66736A', fontSize: 12, textAlign: 'center' },
  button: { minHeight: 36, borderRadius: 8, backgroundColor: '#FFFFFF', justifyContent: 'center', paddingHorizontal: 13, marginTop: 3 },
  buttonText: { color: '#167A45', fontSize: 12, fontWeight: '700' },
});
