import { SymbolView } from 'expo-symbols';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [soilValues, setSoilValues] = useState({ ph: '', nitrogen: '', phosphorus: '', potassium: '', organicMatter: '', texture: '' });
  const [sampleMetadata, setSampleMetadata] = useState({ labName: '', sampleId: '', sampleDate: '', sampleDepth: '', targetCrop: '', testMethod: '', referenceRanges: '' });

  useEffect(() => {
    void loadSoilAnalysisRecords().then(setRecords);
  }, []);

  useEffect(() => {
    if (!analysisResult || Platform.OS === 'web') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setAnalysisResult(null);
      setAnalysisMessage('');
      return true;
    });
    return () => subscription.remove();
  }, [analysisResult]);

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
    setAnalysisResult(record.result);
    setSoilImage(record.photoUri);
    setSoilValues({
      ph: record.soilValues.ph ?? '',
      nitrogen: record.soilValues.nitrogen ?? '',
      phosphorus: record.soilValues.phosphorus ?? '',
      potassium: record.soilValues.potassium ?? '',
      organicMatter: record.soilValues.organicMatter ?? '',
      texture: record.soilValues.texture ?? '',
    });
    setSampleMetadata({ labName: '', sampleId: '', sampleDate: '', sampleDepth: '', targetCrop: '', testMethod: '', referenceRanges: '', ...record.sampleMetadata });
    setLocationLabel(record.locationLabel);
    setCoordinates({ latitude: record.latitude, longitude: record.longitude, accuracy: null, altitude: record.altitude ?? null });
    setAnalysisMessage('');
  }

  function closeResult() {
    setAnalysisResult(null);
    setAnalysisMessage('');
  }

  async function runAnalysis() {
    if (!coordinates) {
      setAnalysisMessage('Get your current location first so the recommendations use the right area.');
      return;
    }
    const ph = Number(soilValues.ph);
    if (!soilValues.ph.trim() || !Number.isFinite(ph) || ph < 0 || ph > 14) {
      setAnalysisMessage('Enter the pH value from the report (0–14).');
      return;
    }
    const labValues = [soilValues.nitrogen, soilValues.phosphorus, soilValues.potassium, soilValues.organicMatter];
    if (labValues.some((value) => !/\d/.test(value) || !/[a-zA-Z%/]/.test(value))) {
      setAnalysisMessage('Enter N, P, K, and organic matter with the units printed on the report (for example, 12 ppm or 2.1%).');
      return;
    }
    if (!soilValues.texture.trim() || !sampleMetadata.sampleDepth?.trim()) {
      setAnalysisMessage('Add the soil texture and sample depth from the laboratory report.');
      return;
    }
    setAnalyzing(true);
    setAnalysisMessage('');
    setAnalysisResult(null);
    setSoilImage(null);
    try {
      const form = new FormData();
      form.append('ph', soilValues.ph);
      form.append('nitrogen', soilValues.nitrogen);
      form.append('phosphorus', soilValues.phosphorus);
      form.append('potassium', soilValues.potassium);
      form.append('organicMatter', soilValues.organicMatter);
      form.append('texture', soilValues.texture);
      form.append('sampleDepth', sampleMetadata.sampleDepth ?? '');
      form.append('targetCrop', sampleMetadata.targetCrop ?? '');
      form.append('testMethod', sampleMetadata.testMethod ?? '');
      form.append('referenceRanges', sampleMetadata.referenceRanges ?? '');
      form.append('labName', sampleMetadata.labName);
      form.append('sampleId', sampleMetadata.sampleId);
      form.append('sampleDate', sampleMetadata.sampleDate);
      form.append('locationLabel', locationLabel);
      form.append('latitude', String(coordinates.latitude));
      form.append('longitude', String(coordinates.longitude));
      form.append('altitude', coordinates.altitude == null ? '' : String(coordinates.altitude));

      const response = await fetch('/api/soil-analysis', { method: 'POST', body: form });
      const payload = await response.json() as SoilAnalysisResult & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Soil analysis is temporarily unavailable. Try again.');
      setAnalysisResult(payload);
      try {
        const record = await saveSoilAnalysisRecord({
          photoUri: null,
          locationLabel,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          altitude: coordinates.altitude,
          soilValues,
          sampleMetadata,
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
              <Text style={styles.resultTitle}>{soilImage ? 'Legacy soil photo analysis' : 'Pre-Season Analysis'}</Text>
              <View style={styles.resultSummary}>
                {sampleMetadata.labName ? <Text style={styles.resultBody}>Laboratory: {sampleMetadata.labName}</Text> : null}
                {sampleMetadata.sampleId ? <Text style={styles.resultBody}>Sample ID: {sampleMetadata.sampleId}</Text> : null}
                {sampleMetadata.sampleDate ? <Text style={styles.resultBody}>Sample date: {sampleMetadata.sampleDate}</Text> : null}
                {Object.values(soilValues).some(Boolean) ? <Text style={styles.resultBody}>Submitted results: {[soilValues.ph && `pH ${soilValues.ph}`, soilValues.nitrogen && `N ${soilValues.nitrogen}`, soilValues.phosphorus && `P ${soilValues.phosphorus}`, soilValues.potassium && `K ${soilValues.potassium}`, soilValues.organicMatter && `Organic matter ${soilValues.organicMatter}`, soilValues.texture && `Texture: ${soilValues.texture}`, sampleMetadata.sampleDepth && `Depth: ${sampleMetadata.sampleDepth}`].filter(Boolean).join(' · ')}.</Text> : null}
                {analysisResult.labResultsAnalysis ? <Text style={styles.resultSectionTitle}>Soil interpretation</Text> : null}
                {analysisResult.labResultsAnalysis ? <Text style={styles.resultBody}>{analysisResult.labResultsAnalysis}</Text> : null}
                {analysisResult.soilAnalysisFromImage ? <Text style={styles.resultBody}>Previous photo-based analysis: {analysisResult.soilAnalysisFromImage}</Text> : null}
                {analysisResult.soilPropertiesAnalysis ? <Text style={styles.resultBody}>{analysisResult.soilPropertiesAnalysis}</Text> : null}
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

              <Text style={styles.resultSectionTitle}>Seed recommendations &amp; supporting evidence</Text>
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
              )) : <Text style={styles.resultBody}>No registered variety could be verified for this result. Review the entered crop and location, then run the analysis again.</Text>}
              {analysisResult.dataSources?.length ? (
                <View style={styles.dataSources}>
                  <Text style={styles.dataSourcesTitle}>Data sources</Text>
                  {analysisResult.dataSources.map((source) => <Text key={source} style={styles.dataSource}>{source}</Text>)}
                </View>
              ) : null}
              {analysisResult.cautions.length ? (
                <View style={styles.cautionBox}>
                  {analysisResult.cautions.map((caution, index) => <Text key={`${index}-${caution}`} style={styles.cautionText}>{caution}</Text>)}
                </View>
              ) : null}
            </View>
          ) : (
          <>
          <Text style={styles.locationHint}>Enter every result exactly as printed, including units.</Text>
          <View style={styles.labGrid}>
              <View style={styles.labField}>
                <Text style={styles.labLabel}>pH</Text>
                <TextInput accessibilityLabel="Lab soil pH" keyboardType="decimal-pad" placeholder="eg 5.8" placeholderTextColor="#89918B" value={soilValues.ph} onChangeText={(ph) => setSoilValues((current) => ({ ...current, ph }))} style={styles.input} />
              </View>
              <View style={styles.labField}>
                <Text style={styles.labLabel}>Nitrogen (N)</Text>
                <TextInput accessibilityLabel="Lab nitrogen value and unit" placeholder="e.g. 12 ppm" placeholderTextColor="#89918B" value={soilValues.nitrogen} onChangeText={(nitrogen) => setSoilValues((current) => ({ ...current, nitrogen }))} style={styles.input} />
              </View>
              <View style={styles.labField}>
                <Text style={styles.labLabel}>Phosphorus (P)</Text>
                <TextInput accessibilityLabel="Lab phosphorus value and unit" placeholder="e.g. 10 ppm" placeholderTextColor="#89918B" value={soilValues.phosphorus} onChangeText={(phosphorus) => setSoilValues((current) => ({ ...current, phosphorus }))} style={styles.input} />
              </View>
              <View style={styles.labField}>
                <Text style={styles.labLabel}>Potassium (K)</Text>
                <TextInput accessibilityLabel="Lab potassium value and unit" placeholder="e.g. 12 ppm" placeholderTextColor="#89918B" value={soilValues.potassium} onChangeText={(potassium) => setSoilValues((current) => ({ ...current, potassium }))} style={styles.input} />
              </View>
              <View style={styles.labField}>
                <Text style={styles.labLabel}>Organic matter</Text>
                <TextInput accessibilityLabel="Lab organic matter value and unit" placeholder="e.g. 2.1% or 21 g/kg" placeholderTextColor="#89918B" value={soilValues.organicMatter} onChangeText={(organicMatter) => setSoilValues((current) => ({ ...current, organicMatter }))} style={styles.input} />
              </View>
              <View style={styles.labField}>
                <Text style={styles.labLabel}>Soil texture</Text>
                <TextInput accessibilityLabel="Lab soil texture" placeholder="e.g. sandy loam" placeholderTextColor="#89918B" value={soilValues.texture} onChangeText={(texture) => setSoilValues((current) => ({ ...current, texture }))} style={styles.input} />
              </View>
          </View>

          <View style={styles.reportDetails}>
            <Text style={styles.labLabel}>Sample depth (required)</Text>
            <TextInput accessibilityLabel="Soil sample depth" placeholder="e.g. 0–20 cm" placeholderTextColor="#89918B" value={sampleMetadata.sampleDepth ?? ''} onChangeText={(sampleDepth) => setSampleMetadata((current) => ({ ...current, sampleDepth }))} style={styles.metadataInput} />
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showReportDetails }} onPress={() => setShowReportDetails((current) => !current)} style={styles.detailsToggle}>
              <Text style={styles.detailsToggleText}>{showReportDetails ? 'Hide extra report details' : 'Add report details for a better match (optional)'}</Text>
              <SymbolView name={{ ios: showReportDetails ? 'chevron.up' : 'chevron.down', android: showReportDetails ? 'expand_less' : 'expand_more', web: showReportDetails ? 'expand_less' : 'expand_more' }} tintColor={green} size={16} />
            </Pressable>
            {showReportDetails ? (
              <>
                <TextInput accessibilityLabel="Preferred crop" placeholder="Crop you plan to grow (optional)" placeholderTextColor="#89918B" value={sampleMetadata.targetCrop ?? ''} onChangeText={(targetCrop) => setSampleMetadata((current) => ({ ...current, targetCrop }))} style={styles.metadataInput} />
                <TextInput accessibilityLabel="Laboratory test method" placeholder="Lab test method (if shown)" placeholderTextColor="#89918B" value={sampleMetadata.testMethod ?? ''} onChangeText={(testMethod) => setSampleMetadata((current) => ({ ...current, testMethod }))} style={styles.metadataInput} />
                <TextInput accessibilityLabel="Lab interpretation ranges" placeholder="Reference ranges / interpretation from report" placeholderTextColor="#89918B" value={sampleMetadata.referenceRanges ?? ''} onChangeText={(referenceRanges) => setSampleMetadata((current) => ({ ...current, referenceRanges }))} style={[styles.metadataInput, styles.multilineInput]} multiline />
              </>
            ) : null}
          </View>

          <View style={styles.locationRow}>
            <View style={styles.pinBadge}>
              <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} tintColor="#FFFFFF" size={18} />
            </View>
            <Text style={styles.fieldLocation} numberOfLines={1}>{locationLabel}</Text>
            <Pressable accessibilityRole="button" disabled={locating} onPress={() => void refreshCurrentLocation()}>
              {locating ? <ActivityIndicator size="small" color="#2767D9" /> : <Text style={styles.changeText}>change</Text>}
            </Pressable>
          </View>

          <SoilLocationMap
            coordinates={coordinates}
            onLocate={() => void refreshCurrentLocation()}
            onSelectLocation={(latitude, longitude) => void selectMapLocation(latitude, longitude)}
          />

          <Pressable accessibilityRole="button" disabled={analyzing} onPress={() => void runAnalysis()} style={({ pressed }) => [styles.actionButton, styles.runButton, pressed && styles.pressed, analyzing && styles.disabledButton]}>
            {analyzing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionText}>run the analysis</Text>}
          </Pressable>
          {analysisMessage ? <Text style={styles.analysisMessage}>{analysisMessage}</Text> : null}
          </>
          )}
          {!analysisResult ? (
          <>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent soil records</Text>
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
              <Text style={styles.recordLocation} numberOfLines={2}>{record.sampleMetadata?.sampleId ? `Lab sample ${record.sampleMetadata.sampleId}` : record.photoUri ? 'Previous photo analysis' : 'Soil analysis'} · {record.locationLabel}</Text>
              <Text style={styles.recordDate}>{new Date(record.createdAt).toLocaleDateString()}</Text>
            </Pressable>
          )) : (
            <Text style={styles.emptyRecords}>Saved soil analyses will appear here.</Text>
          )}
          </>
          ) : null}
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => {
                if (analysisResult) closeResult();
                else onBack();
              }}
              style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
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
  header: { minHeight: 64, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
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
  input: { width: '100%', height: 42, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#5DAC2C', paddingHorizontal: 24, color: ink, fontSize: 13 },
  metadataInput: { height: 42, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E5DE', paddingHorizontal: 10, color: ink, fontSize: 12, marginBottom: 8 },
  reportDetails: { marginHorizontal: 28, marginTop: 10 },
  detailsToggle: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  detailsToggleText: { color: green, fontSize: 12, fontWeight: '600' },
  multilineInput: { height: 72, textAlignVertical: 'top', paddingTop: 10 },
  metadataHalf: { width: '49%' },
  labGrid: { flexDirection: 'column', gap: 9, marginHorizontal: 28, marginTop: 4 },
  labField: { width: '100%', gap: 3 },
  labLabel: { color: ink, fontSize: 13, fontWeight: '400' },
  locationHint: { color: ink, fontSize: 13, textAlign: 'left', marginHorizontal: 28, marginTop: 6, marginBottom: 4 },
  locationRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 8, marginHorizontal: 34, marginTop: 6, marginBottom: 6 },
  pinBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1672E8', alignItems: 'center', justifyContent: 'center' },
  fieldLocation: { maxWidth: '60%', color: muted, fontSize: 12 },
  changeText: { color: '#2767D9', fontSize: 11, marginLeft: 8 },
  runButton: { marginHorizontal: 28, marginTop: 8, borderRadius: 0 },
  results: { paddingHorizontal: 13, paddingTop: 8 },
  resultPhoto: { width: '72%', height: 150, alignSelf: 'center', borderRadius: 4, marginBottom: 18 },
  resultTitle: { color: ink, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 9 },
  resultSectionTitle: { color: ink, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 15, marginBottom: 9 },
  resultSummary: { padding: 12, backgroundColor: '#DCDCDC', marginHorizontal: 2, gap: 8 },
  resultBody: { color: ink, fontSize: 12, lineHeight: 17 },
  resultLocation: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  seedResult: { padding: 12, borderWidth: 1, borderColor: '#D8DFD8', borderRadius: 8, marginBottom: 8, backgroundColor: '#FFFFFF' },
  dataSources: { gap: 5, marginTop: 14, padding: 11, backgroundColor: '#F3F6F1', borderRadius: 8 },
  dataSourcesTitle: { color: ink, fontSize: 12, fontWeight: '700' },
  dataSource: { color: muted, fontSize: 10, lineHeight: 14 },
  seedName: { color: green, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  seedMeta: { color: muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  evidence: { color: ink, fontSize: 11, lineHeight: 16, marginTop: 4 },
  cautionBox: { gap: 5, padding: 10, backgroundColor: '#FFF7E8', borderRadius: 8, marginTop: 7 },
  cautionText: { color: '#674A13', fontSize: 11, lineHeight: 16 },
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
