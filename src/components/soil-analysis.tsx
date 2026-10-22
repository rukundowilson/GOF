import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SoilLocationMap from '@/components/soil-location-map';
import type { FieldLocation } from '@/utils/field-location';

const green = '#167A45';
const ink = '#1E2822';
const muted = '#737B75';
type CurrentCoordinates = { latitude: number; longitude: number; accuracy: number | null; altitude: number | null };

export default function SoilAnalysisScreen({ fieldLocation, onBack }: { fieldLocation: FieldLocation | null; onBack?: () => void }) {
  const [soilImage, setSoilImage] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState(false);
  const [locationLabel, setLocationLabel] = useState(fieldLocation?.label ?? 'Current location unavailable');
  const [coordinates, setCoordinates] = useState<CurrentCoordinates | null>(
    fieldLocation?.latitude != null && fieldLocation.longitude != null
      ? { latitude: fieldLocation.latitude, longitude: fieldLocation.longitude, accuracy: null, altitude: fieldLocation.altitude }
      : null,
  );
  const [locating, setLocating] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [soilValues, setSoilValues] = useState({ ph: '', nitrogen: '', moisture: '' });

  useEffect(() => {
    if (fieldLocation?.latitude == null || fieldLocation.longitude == null) return;
    let active = true;
    void Location.reverseGeocodeAsync({ latitude: fieldLocation.latitude, longitude: fieldLocation.longitude })
      .then((addresses) => {
        if (!active) return;
        const place = addresses[0];
        const parts = [place?.district, place?.subregion, place?.city, place?.region]
          .filter(Boolean)
          .filter((part, index, all) => all.indexOf(part) === index);
        if (parts.length) setLocationLabel(parts.join(', '));
      })
      .catch(() => {
        // Keep the location label already provided by the home screen.
      });
    return () => { active = false; };
  }, [fieldLocation]);

  async function refreshCurrentLocation() {
    setLocating(true);
    setAnalysisMessage('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setAnalysisMessage('Allow location access to show your current area on the map.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
      });
      try {
        const addresses = await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        const place = addresses[0];
        const parts = [place?.district, place?.city, place?.region].filter(Boolean).filter((part, index, all) => all.indexOf(part) === index);
        setLocationLabel(parts.length ? parts.join(', ') : 'Current location');
      } catch {
        setLocationLabel('Current location');
      }
    } catch {
      setAnalysisMessage('Could not get your current location. Check your phone location settings and try again.');
    } finally {
      setLocating(false);
    }
  }

  async function selectMapLocation(latitude: number, longitude: number) {
    setCoordinates({ latitude, longitude, accuracy: null, altitude: null });
    setAnalysisMessage('');
    setLocationLabel('Selected location');
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = addresses[0];
      const parts = [place?.district, place?.city, place?.region]
        .filter(Boolean)
        .filter((part, index, all) => all.indexOf(part) === index);
      if (parts.length) setLocationLabel(parts.join(', '));
    } catch {
      // Keep the selected-location label when reverse geocoding is unavailable.
    }
  }

  async function pickSoilImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled) {
      setSoilImage(result.assets[0].uri);
      setAnalysisMessage('');
    }
  }

  function runAnalysis() {
    if (!coordinates) {
      setAnalysisMessage('Get your current location first so the recommendations use the right area.');
      return;
    }
    if (!soilImage && !soilValues.ph && !soilValues.nitrogen && !soilValues.moisture) {
      setAnalysisMessage('Add a soil image or enter soil properties to continue.');
      return;
    }
    setAnalysisMessage('Your soil information is ready. Soil analysis will be available soon.');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo/gof logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="GOF+ logo"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh current location"
              onPress={() => void refreshCurrentLocation()}
              style={styles.headerLocation}>
              <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} tintColor="#1672E8" size={15} />
              <Text style={styles.headerLocationText}>{locationLabel}</Text>
              <SymbolView name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} tintColor={muted} size={13} />
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => void pickSoilImage()} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Text style={styles.actionText}>{soilImage ? 'Change soil image' : 'Upload soil image'}</Text>
            </Pressable>
            {soilImage ? <Image source={{ uri: soilImage }} style={styles.selectedImage} resizeMode="cover" /> : null}
            <Text style={styles.orText}>or</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showProperties }}
              onPress={() => setShowProperties((visible) => !visible)}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Text style={styles.actionText}>{showProperties ? 'Hide soil properties' : 'Enter soil properties'}</Text>
            </Pressable>
          </View>

          {showProperties ? (
            <View style={styles.propertiesPanel}>
              <Text style={styles.propertiesTitle}>Soil test results</Text>
              <View style={styles.inputRow}>
                <TextInput accessibilityLabel="Soil pH" keyboardType="decimal-pad" placeholder="pH" placeholderTextColor="#89918B" value={soilValues.ph} onChangeText={(ph) => setSoilValues((current) => ({ ...current, ph }))} style={styles.input} />
                <TextInput accessibilityLabel="Nitrogen level" keyboardType="decimal-pad" placeholder="Nitrogen" placeholderTextColor="#89918B" value={soilValues.nitrogen} onChangeText={(nitrogen) => setSoilValues((current) => ({ ...current, nitrogen }))} style={styles.input} />
                <TextInput accessibilityLabel="Soil moisture" keyboardType="decimal-pad" placeholder="Moisture" placeholderTextColor="#89918B" value={soilValues.moisture} onChangeText={(moisture) => setSoilValues((current) => ({ ...current, moisture }))} style={styles.input} />
              </View>
            </View>
          ) : null}

          <Text style={styles.locationHint}>Your current location determines local advice. Tap the map to choose another location.</Text>
          <View style={styles.locationRow}>
            <View style={styles.pinBadge}>
              <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} tintColor="#FFFFFF" size={18} />
            </View>
            <Text style={styles.fieldLocation} numberOfLines={1}>{locationLabel}</Text>
            <Pressable accessibilityRole="button" disabled={locating} onPress={() => void refreshCurrentLocation()}>
              {locating ? <ActivityIndicator size="small" color="#2767D9" /> : <Text style={styles.changeText}>refresh</Text>}
            </Pressable>
          </View>

          <SoilLocationMap
            coordinates={coordinates}
            onLocate={() => void refreshCurrentLocation()}
            onSelectLocation={(latitude, longitude) => void selectMapLocation(latitude, longitude)}
          />

          <Pressable accessibilityRole="button" onPress={runAnalysis} style={({ pressed }) => [styles.actionButton, styles.runButton, pressed && styles.pressed]}>
            <Text style={styles.actionText}>Run analysis</Text>
          </Pressable>
          {analysisMessage ? <Text style={styles.analysisMessage}>{analysisMessage}</Text> : null}

          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent records</Text>
            <Pressable accessibilityRole="button"><Text style={styles.seeAll}>See all</Text></Pressable>
          </View>
          <Pressable style={({ pressed }) => [styles.record, pressed && styles.pressed]}>
            <View style={styles.recordChevron}><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={ink} size={15} /></View>
            <Text style={styles.recordLocation} numberOfLines={1}>{locationLabel}</Text>
            <Text style={styles.recordDate}>2026-10-10</Text>
          </Pressable>
          {onBack ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Back to seed selection" onPress={onBack} style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
              <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={green} size={17} />
              <Text style={styles.backLinkText}>Back</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { minHeight: 72, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  logo: { width: 126, height: 56 },
  headerLocation: { maxWidth: '55%', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8 },
  headerLocationText: { color: muted, fontSize: 11 },
  actions: { paddingHorizontal: 13 },
  actionButton: { minHeight: 48, borderRadius: 10, backgroundColor: '#5DAC2C', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  actionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  selectedImage: { width: '100%', height: 150, borderRadius: 10, marginTop: 10 },
  orText: { alignSelf: 'center', color: ink, fontSize: 13, marginVertical: 9 },
  propertiesPanel: { marginHorizontal: 13, marginTop: 10, padding: 13, borderWidth: 1, borderColor: '#E7EBE6', borderRadius: 12, backgroundColor: '#FAFBF9' },
  propertiesTitle: { color: ink, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, minWidth: 0, height: 42, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E5DE', paddingHorizontal: 10, color: ink, fontSize: 12 },
  locationHint: { color: ink, fontSize: 11, textAlign: 'center', marginTop: 18, marginBottom: 12 },
  locationRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  pinBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1672E8', alignItems: 'center', justifyContent: 'center' },
  fieldLocation: { maxWidth: '60%', color: muted, fontSize: 12 },
  changeText: { color: '#2767D9', fontSize: 11, marginLeft: 8 },
  runButton: { marginHorizontal: 13, marginTop: 18 },
  analysisMessage: { color: muted, textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 8, paddingHorizontal: 12 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 19, marginBottom: 9, paddingHorizontal: 12 },
  recentTitle: { color: ink, fontSize: 13, fontWeight: '600' },
  seeAll: { color: green, fontSize: 11, fontWeight: '600' },
  record: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E7E7E7', borderRadius: 8, paddingHorizontal: 12, marginHorizontal: 13 },
  recordChevron: { width: 16 },
  recordLocation: { flex: 1, color: ink, fontSize: 12 },
  recordDate: { color: ink, fontSize: 11, fontVariant: ['tabular-nums'] },
  backLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12 },
  backLinkText: { color: green, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
