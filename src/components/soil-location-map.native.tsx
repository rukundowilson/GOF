import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SymbolView } from 'expo-symbols';

type Coordinates = { latitude: number; longitude: number; accuracy: number | null };
type Props = {
  coordinates: Coordinates | null;
  onLocate: () => void;
  onSelectLocation: (latitude: number, longitude: number) => void;
};

export default function SoilLocationMap({ coordinates, onLocate, onSelectLocation }: Props) {
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

  const { latitude, longitude } = coordinates;
  const radius = Math.max(coordinates.accuracy ?? 75, 75);
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;width:100%;margin:0;background:#e8f1eb}#error{display:none;position:absolute;z-index:1000;left:8px;right:8px;top:8px;padding:8px;background:#fff;border-radius:6px;font:13px sans-serif;color:#34443a}</style></head><body><div id="map"></div><div id="error">Map tiles could not load. Check your internet connection.</div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const center=[${latitude},${longitude}];const map=L.map('map',{zoomControl:false}).setView(center,15);const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);const marker=L.marker(center).addTo(map);const circle=L.circle(center,{radius:${radius},color:'#1c78e5',fillColor:'#1c78e5',fillOpacity:0.16,weight:2}).addTo(map);map.on('click',e=>{const point=e.latlng;marker.setLatLng(point);circle.setLatLng(point);window.ReactNativeWebView.postMessage(JSON.stringify({latitude:point.lat,longitude:point.lng}))});let loaded=0;const error=document.getElementById('error');tiles.on('tileload',()=>{loaded++;error.style.display='none'});tiles.on('tileerror',()=>{if(loaded===0)error.style.display='block'});setTimeout(()=>{if(loaded===0)error.style.display='block'},7000);</script></body></html>`;

  return (
    <View style={styles.map}>
      <WebView
        accessibilityLabel="Map centered on your current location. Tap the map to select a different location."
        source={{ html, baseUrl: 'https://www.openstreetmap.org' }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        nestedScrollEnabled
        scrollEnabled
        onMessage={(event) => {
          try {
            const point = JSON.parse(event.nativeEvent.data) as { latitude?: number; longitude?: number };
            if (typeof point.latitude === 'number' && typeof point.longitude === 'number') {
              onSelectLocation(point.latitude, point.longitude);
            }
          } catch {
            // Ignore messages that are not map selections.
          }
        }}
      />
      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: 120, backgroundColor: '#E8F1EB', overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: '#E8F1EB' },
  emptyMap: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  emptyText: { color: '#66736A', fontSize: 12, textAlign: 'center' },
  locateButton: { minHeight: 36, borderRadius: 8, backgroundColor: '#FFFFFF', justifyContent: 'center', paddingHorizontal: 13, marginTop: 3 },
  locateText: { color: '#167A45', fontSize: 12, fontWeight: '700' },
  attribution: { position: 'absolute', right: 5, bottom: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.92)', color: '#34443A', fontSize: 10 },
});
