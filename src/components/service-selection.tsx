import CropCamera from '@/components/crop-camera';
import CropPhotoReview from '@/components/crop-photo-review';
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
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    id: 'weather',
    title: 'Weather',
    description: 'Local forecasts for field decisions.',
    ready: false,
    icon: { ios: 'cloud.sun.rain.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' },
    iconColor: '#D39A18',
    iconBackground: '#FFF5DE',
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
  {
    id: 'seasonal',
    title: 'Seasonal guidance',
    description: 'Plan the right work for the season.',
    ready: false,
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
    iconColor: '#438856',
    iconBackground: '#EDF6E9',
  },
] as const satisfies Service[];

export default function ServiceSelection({ onBack }: ServiceSelectionProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoReview, setShowPhotoReview] = useState(false);
  const [showDiagnosisHome, setShowDiagnosisHome] = useState(false);
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (!showDiagnosisHome) return;
    void loadDiagnosisRecords().then(setRecords);
  }, [showDiagnosisHome]);

  const handleDiagnosis = useCallback(async (diagnosis: CropDiagnosis) => {
    try {
      const record = await saveDiagnosisRecord(diagnosis);
      setRecords((current) => [record, ...current].slice(0, 50));
    } catch {
      // Keep the completed diagnosis visible even if device storage is unavailable.
    }
  }, []);

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

  if (showDiagnosisHome && !showCamera) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to services"
                onPress={() => setShowDiagnosisHome(false)}
                style={styles.backButton}>
                <SymbolView
                  name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }}
                  tintColor={ink}
                  size={20}
                />
              </Pressable>
              <Text style={styles.brand}>GOF<Text style={styles.brandPlus}>+</Text></Text>
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

            <Text style={styles.recordsHeading}>SAVED RECORDS</Text>
            {records.length ? records.map((record) => {
              const expanded = expandedRecordId === record.id;
              return (
                <Pressable
                  key={record.id}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setExpandedRecordId(expanded ? null : record.id)}
                  style={({ pressed }) => [styles.recordCard, pressed && styles.cardPressed]}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordText}>
                      <Text style={styles.recordPlant}>{record.plantName}</Text>
                      <Text style={styles.recordIssue}>{record.likelyIssue}</Text>
                    </View>
                    <Text style={styles.recordDate}>{new Date(record.createdAt).toLocaleDateString()}</Text>
                  </View>
                  {expanded ? (
                    <View style={styles.recordDetails}>
                      {record.scientificName ? <Text style={styles.scientificName}>{record.scientificName}</Text> : null}
                      {record.observations.map((item, index) => (
                        <Text key={`observation-${index}`} style={styles.listItem}>• {item}</Text>
                      ))}
                      {record.recommendations.map((item, index) => (
                        <Text key={`recommendation-${index}`} style={styles.listItem}>• {item}</Text>
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              );
            }) : (
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
    setShowDiagnosisHome(true);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to welcome screen"
              onPress={onBack}
              style={styles.backButton}>
              <SymbolView
                name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }}
                tintColor={ink}
                size={20}
              />
            </Pressable>
            <Text style={styles.brand}>GOF<Text style={styles.brandPlus}>+</Text></Text>
          </View>

          <Text style={[styles.title, styles.servicesTitle]}>Your field services</Text>

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
        </View>
      </ScrollView>
    </SafeAreaView>
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
    minHeight: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F2F5F0',
  },
  brand: {
    color: ink,
    fontSize: 19,
    fontWeight: '900',
  },
  brandPlus: {
    color: accent,
  },
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
