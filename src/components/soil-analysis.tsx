import { SymbolView } from 'expo-symbols';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { File as ExpoFile } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SoilLocationMap from '@/components/soil-location-map';
import type { FieldLocation } from '@/utils/field-location';
import { loadSoilAnalysisRecords, saveSoilAnalysisRecord } from '@/utils/soil-analysis-records';
import type { SoilAnalysisRecord, SoilAnalysisResult } from '@/utils/soil-analysis';

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
  const [analysisResult, setAnalysisResult] = useState<SoilAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [records, setRecords] = useState<SoilAnalysisRecord[]>([]);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [viewingRecordId, setViewingRecordId] = useState<string | null>(null);
  const [soilValues, setSoilValues] = useState({ ph: '', nitrogen: '', moisture: '' });

  useEffect(() => {
    void loadSoilAnalysisRecords().then(setRecords);
  }, []);

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

  function openRecord(record: SoilAnalysisRecord) {
    setViewingRecordId(record.id);
    setAnalysisResult(record.result);
    setSoilImage(record.photoUri);
    setSoilValues(record.soilValues);
    setLocationLabel(record.locationLabel);
    setCoordinates({ latitude: record.latitude, longitude: record.longitude, accuracy: null, altitude: null });
    setAnalysisMessage('');
  }

  function closeResult() {
    setAnalysisResult(null);
    setViewingRecordId(null);
    setAnalysisMessage('');
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

  async function runAnalysis() {
    if (!coordinates) {
      setAnalysisMessage('Get your current location first so the recommendations use the right area.');
      return;
    }
    if (!soilImage && !soilValues.ph && !soilValues.nitrogen && !soilValues.moisture) {
      setAnalysisMessage('Add a soil image or enter soil properties to continue.');
      return;
    }
    setAnalyzing(true);
    setAnalysisMessage('');
    setAnalysisResult(null);
    setViewingRecordId(null);
    try {
      const form = new FormData();
      if (soilImage) {
        const extension = soilImage.split('?')[0].toLowerCase().endsWith('.png') ? 'png' : 'jpg';
        if (Platform.OS === 'web') {
          const imageResponse = await fetch(soilImage);
          if (!imageResponse.ok) throw new Error('Could not read the selected soil photo. Choose it again and retry.');
          const imageBlob = await imageResponse.blob();
          const mimeType = imageBlob.type === 'image/png' ? 'image/png' : 'image/jpeg';
          form.append('image', imageBlob, `soil.${mimeType === 'image/png' ? 'png' : 'jpg'}`);
        } else {
          form.append('image', new ExpoFile(soilImage), `soil.${extension}`);
        }
      }
      form.append('ph', soilValues.ph);
      form.append('nitrogen', soilValues.nitrogen);
      form.append('moisture', soilValues.moisture);
      form.append('locationLabel', locationLabel);

      const response = await fetch('/api/soil-analysis', { method: 'POST', body: form });
      const payload = await response.json() as SoilAnalysisResult & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Soil analysis is temporarily unavailable. Try again.');
      setAnalysisResult(payload);
      try {
        const record = await saveSoilAnalysisRecord({
          photoUri: soilImage,
          locationLabel,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          soilValues,
          result: payload,
        });
        setRecords((current) => [record, ...current.filter((item) => item.id !== record.id)].slice(0, 50));
      } catch {
        setAnalysisMessage('Analysis is ready, but this result could not be saved to recent records.');
      }
    } catch (requestError) {
      setAnalysisMessage(requestError instanceof Error ? requestError.message : 'Soil analysis is temporarily unavailable. Try again.');
    } finally {
      setAnalyzing(false);
    }
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

          {analysisResult ? (
            <View style={styles.results}>
              {analysisMessage ? <Text style={styles.analysisMessage}>{analysisMessage}</Text> : null}
              {soilImage ? <Image source={{ uri: soilImage }} style={styles.resultPhoto} resizeMode="cover" /> : null}
              <Text style={styles.resultTitle}>{soilImage ? 'Soil analysis from image' : 'Soil property analysis'}</Text>
              <View style={styles.resultSummary}>
                <Text style={styles.resultBody}>{analysisResult.soilAnalysisFromImage}</Text>
                {Object.values(soilValues).some(Boolean) ? (
                  <Text style={styles.resultBody}>
                    Values entered: {[soilValues.ph && `pH ${soilValues.ph}`, soilValues.nitrogen && `Nitrogen ${soilValues.nitrogen}`, soilValues.moisture && `Moisture ${soilValues.moisture}`].filter(Boolean).join(' · ')}. Units are as entered.
                  </Text>
                ) : null}
                <Text style={styles.resultBody}>{analysisResult.soilPropertiesAnalysis}</Text>
              </View>

              <Text style={styles.resultSectionTitle}>Region analysis</Text>
              <View style={styles.resultLocation}>
                <View style={styles.pinBadge}>
                  <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} tintColor="#FFFFFF" size={18} />
                </View>
                <Text style={styles.fieldLocation} numberOfLines={2}>{locationLabel}</Text>
              </View>
              <View style={styles.resultSummary}>
                {analysisResult.districtContext ? (
                  <>
                    <Text style={styles.resultBody}>
                      {analysisResult.districtContext.district}, {analysisResult.districtContext.province}: district altitude ranges from {analysisResult.districtContext.minAltitude} to {analysisResult.districtContext.maxAltitude} m (average {analysisResult.districtContext.avgAltitude} m).
                    </Text>
                    <Text style={styles.resultBody}>{analysisResult.districtContext.topography}</Text>
                  </>
                ) : null}
                <Text style={styles.resultBody}>{analysisResult.districtAnalysis}</Text>
                <Text style={styles.resultBody}>{analysisResult.weatherForecast}</Text>
              </View>

              <Text style={styles.resultSectionTitle}>Seed selection results &amp; supportive evidence</Text>
              {analysisResult.seedRecommendations.length ? analysisResult.seedRecommendations.map((recommendation, index) => (
                <View key={`${recommendation.crop}-${recommendation.variety}-${index}`} style={styles.seedResult}>
                  <Text style={styles.seedName}>{recommendation.crop} — {recommendation.variety}</Text>
                  <Text style={styles.resultBody}>{recommendation.reason}</Text>
                  <Text style={styles.seedMeta}>Maturity: {recommendation.maturity} · Yield potential: {recommendation.yieldPotential}</Text>
                  <Text style={styles.seedMeta}>Rwanda registered varieties list, source page {recommendation.sourcePage}</Text>
                  {recommendation.supportiveEvidence.map((evidence, evidenceIndex) => (
                    <Text key={`${evidenceIndex}-${evidence}`} style={styles.evidence}>• {evidence}</Text>
                  ))}
                </View>
              )) : <Text style={styles.resultBody}>There is not enough evidence to recommend a registered variety yet. Add more soil test results or ask an agronomist.</Text>}
              {analysisResult.cautions.length ? (
                <View style={styles.cautionBox}>
                  {analysisResult.cautions.map((caution, index) => <Text key={`${index}-${caution}`} style={styles.cautionText}>{caution}</Text>)}
                </View>
              ) : null}
              <Pressable accessibilityRole="button" onPress={closeResult} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
                <Text style={styles.editButtonText}>{viewingRecordId ? 'Back to recent records' : 'Edit soil inputs'}</Text>
              </Pressable>
            </View>
          ) : (
          <>
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

          <Text style={styles.locationHint}>Add a soil photo or test values for better seed recommendations.</Text>
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

          <Pressable accessibilityRole="button" disabled={analyzing} onPress={() => void runAnalysis()} style={({ pressed }) => [styles.actionButton, styles.runButton, pressed && styles.pressed, analyzing && styles.disabledButton]}>
            {analyzing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionText}>Run analysis</Text>}
          </Pressable>
          {analysisMessage ? <Text style={styles.analysisMessage}>{analysisMessage}</Text> : null}
          </>
          )}
          {!analysisResult ? (
          <>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent records</Text>
            {records.length > 5 ? (
              <Pressable accessibilityRole="button" onPress={() => setShowAllRecords((current) => !current)}>
                <Text style={styles.seeAll}>{showAllRecords ? 'Show recent' : 'See all'}</Text>
              </Pressable>
            ) : null}
          </View>
          {records.length ? records.slice(0, showAllRecords ? records.length : 5).map((record) => (
            <Pressable
              key={record.id}
              accessibilityRole="button"
              accessibilityLabel={`Open soil analysis from ${record.locationLabel}, ${new Date(record.createdAt).toLocaleDateString()}`}
              onPress={() => openRecord(record)}
              style={({ pressed }) => [styles.record, pressed && styles.pressed]}>
              {record.photoUri ? <Image source={{ uri: record.photoUri }} style={styles.recordPhoto} resizeMode="cover" /> : null}
              <View style={styles.recordChevron}><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={ink} size={15} /></View>
              <Text style={styles.recordLocation} numberOfLines={2}>{record.locationLabel}</Text>
              <Text style={styles.recordDate}>{new Date(record.createdAt).toLocaleDateString()}</Text>
            </Pressable>
          )) : (
            <Text style={styles.emptyRecords}>Saved soil analyses will appear here.</Text>
          )}
          </>
          ) : null}
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
  disabledButton: { opacity: 0.65 },
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
  results: { paddingHorizontal: 13, paddingTop: 8 },
  resultPhoto: { width: '72%', height: 150, alignSelf: 'center', borderRadius: 4, marginBottom: 18 },
  resultTitle: { color: ink, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 9 },
  resultSectionTitle: { color: ink, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 15, marginBottom: 9 },
  resultSummary: { padding: 12, backgroundColor: '#DCDCDC', marginHorizontal: 2, gap: 8 },
  resultBody: { color: ink, fontSize: 12, lineHeight: 17 },
  resultLocation: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  seedResult: { padding: 12, borderWidth: 1, borderColor: '#D8DFD8', borderRadius: 8, marginBottom: 8, backgroundColor: '#FFFFFF' },
  seedName: { color: green, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  seedMeta: { color: muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  evidence: { color: ink, fontSize: 11, lineHeight: 16, marginTop: 4 },
  cautionBox: { gap: 5, padding: 10, backgroundColor: '#FFF7E8', borderRadius: 8, marginTop: 7 },
  cautionText: { color: '#674A13', fontSize: 11, lineHeight: 16 },
  editButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: green, borderRadius: 9, marginTop: 14 },
  editButtonText: { color: green, fontSize: 13, fontWeight: '700' },
  analysisMessage: { color: muted, textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 8, paddingHorizontal: 12 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 19, marginBottom: 9, paddingHorizontal: 12 },
  recentTitle: { color: ink, fontSize: 13, fontWeight: '600' },
  seeAll: { color: green, fontSize: 11, fontWeight: '600' },
  record: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E7E7E7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginHorizontal: 13, marginBottom: 7 },
  recordPhoto: { width: 44, height: 44, borderRadius: 6 },
  recordChevron: { width: 16 },
  recordLocation: { flex: 1, color: ink, fontSize: 12 },
  recordDate: { color: ink, fontSize: 11, fontVariant: ['tabular-nums'] },
  emptyRecords: { color: muted, fontSize: 12, textAlign: 'center', paddingVertical: 16, paddingHorizontal: 12 },
  backLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12 },
  backLinkText: { color: green, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
