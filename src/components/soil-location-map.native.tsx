import MapView, { Circle } from 'react-native-maps';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

type Coordinates = { latitude: number; longitude: number; accuracy: number | null };

export default function SoilLocationMap({ coordinates, onLocate }: { coordinates: Coordinates | null; onLocate: () => void }) {
  if (!coordinates) {
    return (
      <View style={[styles.map, styles.emptyMap]}>
        <SymbolView name={{ ios: 'map.fill', android: 'map', web: 'map' }} tintColor="#7A8C80" size={28} />
        <Text style={styles.emptyText}>Your current location will appear here</Text>
        <Pressable accessibilityRole="button" onPress={onLocate} style={styles.locateButton}>
          <Text style={styles.locateText}>Use current location</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <MapView
      accessibilityLabel="Map centered on your current location"
      style={styles.map}
      mapType="standard"
      region={{ latitude: coordinates.latitude, longitude: coordinates.longitude, latitudeDelta: 0.018, longitudeDelta: 0.018 }}
      showsUserLocation
      showsMyLocationButton
      showsCompass
      loadingEnabled
      toolbarEnabled={false}>
      <Circle
        center={{ latitude: coordinates.latitude, longitude: coordinates.longitude }}
        radius={Math.max(coordinates.accuracy ?? 75, 75)}
        fillColor="rgba(28, 120, 229, 0.16)"
        strokeColor="rgba(28, 120, 229, 0.55)"
        strokeWidth={1}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: 190 },
  emptyMap: { backgroundColor: '#F1F5F2', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  emptyText: { color: '#66736A', fontSize: 12, textAlign: 'center' },
  locateButton: { minHeight: 36, borderRadius: 8, backgroundColor: '#FFFFFF', justifyContent: 'center', paddingHorizontal: 13, marginTop: 3 },
  locateText: { color: '#167A45', fontSize: 12, fontWeight: '700' },
});
