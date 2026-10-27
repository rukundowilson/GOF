import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

type Coordinates = { latitude: number; longitude: number; accuracy: number | null };

export default function SoilLocationMap({ coordinates, onLocate }: { coordinates: Coordinates | null; onLocate: () => void; onSelectLocation: (latitude: number, longitude: number) => void }) {
  return (
    <View style={styles.map}>
      <SymbolView name={{ ios: 'map.fill', android: 'map', web: 'map' }} tintColor="#7A8C80" size={28} />
      <Text style={styles.text}>{coordinates ? `Selected location: ${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}` : 'Your current location will appear here'}</Text>
      {!coordinates ? (
        <Pressable accessibilityRole="button" onPress={onLocate} style={styles.button}>
          <Text style={styles.buttonText}>Use current location</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: 120, backgroundColor: '#F1F5F2', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  text: { color: '#66736A', fontSize: 12, textAlign: 'center' },
  button: { minHeight: 36, borderRadius: 8, backgroundColor: '#FFFFFF', justifyContent: 'center', paddingHorizontal: 13, marginTop: 3 },
  buttonText: { color: '#167A45', fontSize: 12, fontWeight: '700' },
});
