import CropCamera from '@/components/crop-camera';
import CropPhotoReview from '@/components/crop-photo-review';
import SeedRecommendation from '@/components/seed-recommendation';
import {
  loadDiagnosisRecords,
  saveDiagnosisRecord,
  type CropDiagnosis,
  type DiagnosisRecord,
} from '@/utils/diagnosis-records';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import {
    Platform,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FieldLocation } from '@/utils/field-location';

const accent = '#5DAC2C';
const ink = '#1D2B23';
const muted = '#66736A';

type Service = {
  id: string;
  title: string;
  description: string;
  ready: boolean;
  icon: { ios: string; android: string; web: string };
  iconColor: string;
  iconBackground: string;
};

type ServiceSelectionProps = {
  onBack: () => void;
  location: FieldLocation | null;
};

const services = [
  {
    id: 'diagnosis',
    title: 'Crop diagnosis',
    description: 'Check crop problems from a photo.',
    ready: true,
    icon: { ios: 'leaf.fill', android: 'agriculture', web: 'agriculture' },
    iconColor: '#26844A',
    iconBackground: '#E8F5EC',
  },
  {
    id: 'seed-recommendation',
    title: 'Seed selection and planning',
    description: 'Use AI to match seed options to field conditions.',
    ready: true,
    icon: { ios: 'leaf.arrow.circlepath', android: 'grass', web: 'grass' },
    iconColor: '#438856',
    iconBackground: '#EDF6E9',
  },
  {
    id: 'agronomists',
    title: 'Agronomists',
    description: 'Connect with nearby crop experts.',
    ready: false,
    icon: { ios: 'person.2.fill', android: 'support_agent', web: 'support_agent' },
    iconColor: '#277C85',
    iconBackground: '#E8F5F5',
  },
] as const satisfies Service[];

export default function ServiceSelection({ onBack, location }: ServiceSelectionProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoReview, setShowPhotoReview] = useState(false);
  const [showDiagnosisHome, setShowDiagnosisHome] = useState(false);
  const [showSeedRecommendation, setShowSeedRecommendation] = useState(false);
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DiagnosisRecord | null>(null);

  useEffect(() => {
    if (!showDiagnosisHome) return;
    void loadDiagnosisRecords().then(setRecords);
  }, [showDiagnosisHome]);

  const handleDiagnosis = useCallback(async (diagnosis: CropDiagnosis) => {
    try {
      if (!photoUri) return;
      const record = await saveDiagnosisRecord(diagnosis, photoUri);
      setRecords((current) => [record, ...current].slice(0, 50));
    } catch {
      // Keep the completed diagnosis visible even if device storage is unavailable.
    }
  }, [photoUri]);

  if (showPhotoReview && photoUri) {
    return (
      <CropPhotoReview
        photoUri={photoUri}
        onRetake={() => {
          setShowPhotoReview(false);
          setShowCamera(true);
        }}
        onDone={() => setShowPhotoReview(false)}
        onDiagnosis={handleDiagnosis}
      />
    );
  }

  if (showSeedRecommendation) {
    return (
      <SeedRecommendation
        location={location}
        onBack={() => setShowSeedRecommendation(false)}
      />
    );
  }

  if (selectedRecord) {
    return (
      <SavedDiagnosisDetail
        record={selectedRecord}
        location={location}
        onBack={() => setSelectedRecord(null)}
      />
    );
  }

  if (showDiagnosisHome && !showCamera) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Image
                source={require('../../assets/images/logo/gof logo.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="GOF+ logo"
              />
              <LocationPill location={location} />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setPhotoUri(null);
                setShowCamera(true);
              }}
              style={({ pressed }) => [styles.continueButton, pressed && styles.buttonPressed]}>
              <Text style={styles.continueText}>Start new diagnosis</Text>
              <Text style={styles.arrow}>→</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to services"
              onPress={() => setShowDiagnosisHome(false)}
              style={({ pressed }) => [styles.backLink, styles.listBackLink, pressed && styles.cardPressed]}>
              <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={accent} size={17} />
              <Text style={styles.backLinkText}>Back</Text>
            </Pressable>
            <Text style={styles.recordsHeading}>SAVED RECORDS</Text>
            {records.length ? records.map((record) => (
              <Pressable
                key={record.id}
                accessibilityRole="button"
                accessibilityLabel={`Open diagnosis for ${record.plantName}`}
                onPress={() => setSelectedRecord(record)}
                style={({ pressed }) => [styles.recordCard, styles.recordRow, pressed && styles.cardPressed]}>
                {record.photoUri ? <Image source={{ uri: record.photoUri }} style={styles.recordThumbnail} resizeMode="cover" /> : <View style={styles.recordThumbnailPlaceholder}><SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} tintColor={accent} size={22} /></View>}
                <View style={styles.recordSummary}>
                  <Text style={styles.recordPlant} numberOfLines={1}>{record.plantName}</Text>
                  <Text style={styles.recordIssue} numberOfLines={2}>{record.likelyIssue}</Text>
                  <Text style={styles.recordDate}>{new Date(record.createdAt).toLocaleDateString()}</Text>
                </View>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={muted} size={18} />
              </Pressable>
            )) : (
              <View style={styles.emptyRecords}>
                <Text style={styles.emptyText}>Your completed diagnoses will appear here.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showCamera) {
    return (
      <CropCamera
        onBack={() => setShowCamera(false)}
        onPhotoSelected={(uri) => {
          setPhotoUri(uri);
          setShowCamera(false);
          setShowPhotoReview(true);
        }}
      />
    );
  }

  function continueWithService() {
    if (!selectedService) return;
    setMessage('');

    if (!selectedService.ready) {
      setMessage(`${selectedService.title} is coming soon.`);
      return;
    }
    if (selectedService.id === 'seed-recommendation') {
      setShowSeedRecommendation(true);
      return;
    }
    setShowDiagnosisHome(true);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo/gof logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="GOF+ logo"
            />
            <LocationPill location={location} />
          </View>

          <View style={styles.grid}>
            {services.map((service) => {
              const isSelected = selectedService?.id === service.id;
              return (
                <Pressable
                  key={service.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => {
                    setSelectedService(service);
                    setMessage('');
                  }}
                  style={({ pressed }) => [
                    styles.serviceCard,
                    isSelected && styles.selectedCard,
                    pressed && styles.cardPressed,
                  ]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.iconWrap, { backgroundColor: service.iconBackground }]}>
                      <SymbolView name={service.icon} tintColor={service.iconColor} size={23} />
                    </View>
                    <View style={[styles.selectionMark, isSelected && styles.selectedMark]}>
                      {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{service.title}</Text>
                  <Text style={styles.cardDescription}>{service.description}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={!selectedService}
            onPress={continueWithService}
            style={({ pressed }) => [
              styles.continueButton,
              !selectedService && styles.disabledButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.continueText}>
              {selectedService ? `Continue with ${selectedService.title}` : 'Choose a service'}
            </Text>
            <Text style={styles.arrow}>→</Text>
          </Pressable>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to welcome screen"
            onPress={onBack}
            style={({ pressed }) => [styles.backLink, pressed && styles.cardPressed]}>
            <SymbolView
              name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={accent}
              size={17}
            />
            <Text style={styles.backLinkText}>Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SavedDiagnosisDetail({
  record,
  location,
  onBack,
}: {
  record: DiagnosisRecord;
  location: FieldLocation | null;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={require('../../assets/images/logo/gof logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="GOF+ logo" />
            <LocationPill location={location} />
          </View>
          <Text style={styles.recordDetailDate}>{new Date(record.createdAt).toLocaleDateString()}</Text>
          {record.photoUri ? <Image source={{ uri: record.photoUri }} style={styles.recordPhoto} resizeMode="cover" /> : <View style={styles.missingPhoto}><Text style={styles.emptyText}>Photo unavailable for this record</Text></View>}
          <View style={styles.recordResults}>
            <Text style={styles.resultsTitle}>Diagnosis and treatment plan</Text>
            <View style={styles.diagnosisSection}>
              <Text style={styles.sectionLabel}>CROP</Text>
              <View style={styles.diagnosisHeading}><Text style={styles.resultName}>{record.plantName}</Text><Text style={styles.score}>{Math.round(record.plantConfidence * 100)}%</Text></View>
              {record.scientificName ? <Text style={styles.scientificName}>{record.scientificName}</Text> : null}
            </View>
            <View style={styles.diagnosisSection}>
              <Text style={styles.sectionLabel}>LIKELY PROBLEM</Text>
              <View style={styles.diagnosisHeading}><Text style={styles.resultName}>{record.likelyIssue}</Text><Text style={styles.score}>{Math.round(record.issueConfidence * 100)}%</Text></View>
            </View>
            <View style={styles.primaryRecommendation}>
              <Text style={styles.primaryRecommendationLabel}>MAIN RECOMMENDATION</Text>
              <Text style={styles.primaryRecommendationText}>{record.recommendations[0] ?? 'No safe treatment advice from this photo. Check the crop in the field before using a product.'}</Text>
            </View>
            {record.observations.length ? <View style={styles.diagnosisSection}><Text style={styles.sectionLabel}>WHAT WE CAN SEE</Text>{record.observations.map((item, index) => <Text key={`observation-${index}`} style={styles.listItem}>{'• '}{item}</Text>)}</View> : null}
            {record.recommendations.length > 1 ? <View style={styles.diagnosisSection}><Text style={styles.sectionLabel}>OTHER ACTIONS</Text>{record.recommendations.slice(1).map((item, index) => <Text key={`recommendation-${index}`} style={styles.listItem}>{'• '}{item}</Text>)}</View> : null}
            {record.caution ? <Text style={styles.disclaimer}>{record.caution}</Text> : null}
            <Text style={styles.disclaimer}>For chemicals, check the label for this crop and pest. Follow its dose, safety gear, and harvest waiting time. Ask another agronomist if the problem is unclear or getting worse.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to saved records"
            onPress={onBack}
            style={({ pressed }) => [styles.backLink, pressed && styles.cardPressed]}>
            <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={accent} size={17} />
            <Text style={styles.backLinkText}>Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LocationPill({ location }: { location: FieldLocation | null }) {
  return (
    <View style={styles.locationPill}>
      <SymbolView
        name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
        tintColor="#1672E8"
        size={15}
      />
      <Text style={styles.locationText}>{location?.label ?? 'Location not shared'}</Text>
      <SymbolView
        name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
        tintColor={muted}
        size={13}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ web: 80, default: 12 }),
    paddingBottom: 32,
  },
  content: {
    width: '100%',
    maxWidth: 780,
    alignSelf: 'center',
  },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: accent,
  },
  logo: {
    width: 105,
    height: 58,
  },
  locationPill: {
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 18,
    backgroundColor: '#F5F8F4',
    paddingHorizontal: 10,
    maxWidth: '52%',
  },
  locationText: { color: muted, fontSize: 11, fontWeight: '600', flexShrink: 1 },
  backLink: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 8,
  },
  listBackLink: {
    marginTop: 0,
  },
  backLinkText: { color: accent, fontSize: 14, fontWeight: '700' },
  eyebrow: {
    color: accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 7,
  },
  title: {
    color: ink,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
  },
  servicesTitle: {
    marginBottom: 20,
  },
  subtitle: {
    color: muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  serviceCard: {
    width: '48.5%',
    minHeight: 166,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E3EAE2',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedCard: {
    borderColor: accent,
    backgroundColor: '#F7FBF5',
  },
  cardPressed: {
    opacity: 0.82,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  selectionMark: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#D6DFD4',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMark: {
    borderColor: accent,
    backgroundColor: accent,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  cardTitle: {
    color: ink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  cardDescription: {
    color: muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  continueButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 10,
    backgroundColor: accent,
    marginTop: 18,
    paddingHorizontal: 18,
  },
  disabledButton: {
    backgroundColor: '#B8C7B2',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
  },
  message: {
    color: muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 9,
  },
  recordsHeading: {
    color: muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 28,
    marginBottom: 10,
  },
  recordCard: {
    borderWidth: 1,
    borderColor: '#E3EAE2',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 10,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
  },
  recordThumbnail: {
    width: 66,
    height: 66,
    borderRadius: 9,
    backgroundColor: '#E8EEE8',
  },
  recordThumbnailPlaceholder: {
    width: 66,
    height: 66,
    borderRadius: 9,
    backgroundColor: '#EDF6E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordSummary: {
    flex: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  recordText: {
    flex: 1,
  },
  recordPlant: {
    color: ink,
    fontSize: 15,
    fontWeight: '800',
  },
  recordIssue: {
    color: muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  recordDate: {
    color: muted,
    fontSize: 10,
    marginTop: 5,
  },
  recordDetailDate: {
    color: muted,
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 8,
  },
  recordPhoto: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#E8EEE8',
  },
  missingPhoto: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5EF',
  },
  recordResults: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAF7',
  },
  resultsTitle: {
    color: ink,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 14,
  },
  diagnosisSection: {
    borderTopWidth: 1,
    borderColor: '#E5EAE3',
    paddingVertical: 12,
  },
  sectionLabel: {
    color: muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  diagnosisHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 5,
  },
  resultName: {
    flex: 1,
    flexShrink: 1,
    color: ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  score: {
    flexShrink: 0,
    color: accent,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryRecommendation: {
    marginBottom: 12,
  },
  primaryRecommendationLabel: {
    color: '#34752A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  primaryRecommendationText: {
    color: '#34752A',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    marginTop: 7,
  },
  disclaimer: {
    color: muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  recordDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E8EEE8',
    marginTop: 12,
    paddingTop: 10,
  },
  scientificName: {
    color: muted,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  listItem: {
    color: ink,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  emptyRecords: {
    minHeight: 76,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F8F4',
    padding: 16,
  },
  emptyText: {
    color: muted,
    fontSize: 13,
    textAlign: 'center',
  },
});
