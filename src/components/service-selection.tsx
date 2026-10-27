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
    Linking,
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
  image: number;
  imageLabel: string;
};

type ServiceSelectionProps = {
  onBack: () => void;
  location: FieldLocation | null;
};

const services = [
  {
    id: 'diagnosis',
    title: 'Crop diagnosis',
    description: 'Upload a crop photo to check for pests, disease, or stress and review treatment guidance.',
    ready: true,
    image: require('../../assets/images/cam scan.webp'),
    imageLabel: 'Illustration of a plant ready to scan',
  },
  {
    id: 'seed-recommendation',
    title: 'Seed selection',
    description: "Use lab results, location, district altitude, and forecast to compare registered Rwanda seed varieties.",
    ready: true,
    image: require('../../assets/images/seeds.jpg'),
    imageLabel: 'Seeds ready for planting',
  },
  {
    id: 'national-programs',
    title: 'National programs',
    description: 'Browse trusted government programs, see what farmer support they offer, and find where to learn more.',
    ready: true,
    image: require('../../assets/images/people-national programs.png'),
    imageLabel: 'People representing national programs',
  },
] as const satisfies Service[];

const nationalPrograms = [
  {
    title: 'smart nkunganire',
    description: 'enables farmers to submit an application for subsidized agro-inputs',
    url: 'https://www.minagri.gov.rw/updates/news-details/smart-nkunganire-system-to-enhance-access-to-agriculture-inputs',
  },
  {
    title: 'Smart Kungahara System',
    description: 'a digital record-keeping and payment system for coffee, tea, and other cash-crop farmers',
    url: 'https://smartkungahara.rw/',
  },
  {
    title: 'Tekana Urishingiwe',
    description: 'a government initiative providing farmers with financial protection against the risks associated with agriculture',
    url: 'https://www.minagri.gov.rw/updates/news-details/minagri-and-rab-spiu-encourage-farmers-to-embrace-the-national-agriculture-insurance-scheme-nais',
  },
  {
    title: 'Twigire Muhinzi',
    description: 'a farmer-centered extension program that brings agricultural advice and training closer to farmers',
    url: 'https://www.rab.gov.rw/agriculture-development/crop-innovation-tech-transfer',
  },
] as const;

export default function ServiceSelection({ onBack, location }: ServiceSelectionProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoReview, setShowPhotoReview] = useState(false);
  const [showDiagnosisHome, setShowDiagnosisHome] = useState(false);
  const [showSeedRecommendation, setShowSeedRecommendation] = useState(false);
  const [showNationalPrograms, setShowNationalPrograms] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<(typeof nationalPrograms)[number] | null>(null);
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

  if (showNationalPrograms) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Image source={require('../../assets/images/logo/gof logo.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="GOF+ logo" />
              <LocationPill location={location} />
            </View>
            {selectedProgram ? (selectedProgram === nationalPrograms[0] ? (
              <>
                <Text style={styles.smartTitle}>smart nkunganire</Text>
                <Text style={styles.smartIntro}>SNS lets farmers register and apply for subsidized agro-inputs on time using the *774# USSD code.</Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => { void Linking.openURL('https://smartnkunganire.rw/#how-it-works').catch(() => setMessage('Could not open the Smart Nkunganire website.')); }}
                  style={({ pressed }) => [styles.smartWebsiteLink, pressed && styles.cardPressed]}>
                  <Text style={styles.smartWebsiteText}>https://smartnkunganire.rw/#how-it-works</Text>
                </Pressable>
                <View style={styles.smartActions}>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => { void Linking.openURL('https://smartnkunganire.rw/').catch(() => setMessage('Could not open the Smart Nkunganire website.')); }}
                    style={({ pressed }) => [styles.smartActionButton, pressed && styles.cardPressed]}>
                    <Text style={styles.smartActionText}>Order online</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => { void Linking.openURL('tel:*774%23').catch(() => setMessage('Dial *774# from your mobile phone to continue.')); }}
                    style={({ pressed }) => [styles.smartActionButton, styles.smartUssdButton, pressed && styles.cardPressed]}>
                    <Text style={styles.smartActionText}>Dial *774#</Text>
                  </Pressable>
                </View>
                <View style={styles.smartHowItWorks}>
                  <Text style={styles.smartHowTitle}>how it works</Text>
                  <View style={styles.kungaharaSteps}>
                    <View style={styles.kungaharaStep}>
                      <Text style={styles.kungaharaBullet}>{'\u2022'}</Text>
                      <View style={styles.kungaharaStepCopy}>
                        <Text style={styles.kungaharaStepTitle}>Agro-input supply</Text>
                        <Text style={styles.kungaharaStepDescription}>Suppliers sell to agro-dealers, who provide inputs to farmers.</Text>
                      </View>
                    </View>
                    <View style={styles.kungaharaStep}>
                      <Text style={styles.kungaharaBullet}>{'\u2022'}</Text>
                      <View style={styles.kungaharaStepCopy}>
                        <Text style={styles.kungaharaStepTitle}>Connected warehouses</Text>
                        <Text style={styles.kungaharaStepDescription}>Warehouses link digitally with agro-dealers to share stock availability countrywide.</Text>
                      </View>
                    </View>
                    <View style={styles.kungaharaStep}>
                      <Text style={styles.kungaharaBullet}>{'\u2022'}</Text>
                      <View style={styles.kungaharaStepCopy}>
                        <Text style={styles.kungaharaStepTitle}>Ordering and delivery</Text>
                        <Text style={styles.kungaharaStepDescription}>Agro-dealers order supplies and receive deliveries at registered shops.</Text>
                      </View>
                    </View>
                    <View style={styles.kungaharaStep}>
                      <Text style={styles.kungaharaBullet}>{'\u2022'}</Text>
                      <View style={styles.kungaharaStepCopy}>
                        <Text style={styles.kungaharaStepTitle}>Digital sales</Text>
                        <Text style={styles.kungaharaStepDescription}>Agro-dealers manage inventory and sell inputs to farmers.</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.smartTitle}>smart kungahara system</Text>
                <Text style={styles.smartIntro}>A digital notebook and payment tool for coffee, tea, and other crops. It helps farmers get recognized, access fertilizers, track harvests from farm to washing station, and receive secure payments on their phones.{'\n'}get service on USSD *774*2#</Text>
                <View style={[styles.smartActions, styles.kungaharaActions]}>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => { void Linking.openURL('tel:*774*2%23').catch(() => setMessage('Dial *774*2# from your mobile phone to continue.')); }}
                    style={({ pressed }) => [styles.smartActionButton, styles.smartUssdButton, pressed && styles.cardPressed]}>
                    <Text style={styles.smartActionText}>Dial *774*2#</Text>
                  </Pressable>
                </View>
                <View style={[styles.smartHowItWorks, styles.kungaharaHowItWorks]}>
                  <Text style={styles.smartHowTitle}>how it works</Text>
                  <View style={styles.kungaharaSteps}>
                    <View style={styles.kungaharaStep}>
                      <Text style={styles.kungaharaBullet}>•</Text>
                      <View style={styles.kungaharaStepCopy}>
                        <Text style={styles.kungaharaStepTitle}>Register Your Farm</Text>
                        <Text style={styles.kungaharaStepDescription}>Sign up with your National ID and Mobile Money number at your cooperative to get your unique Farmer ID.</Text>
                      </View>
                    </View>
                    <View style={styles.kungaharaStep}>
                      <Text style={styles.kungaharaBullet}>•</Text>
                      <View style={styles.kungaharaStepCopy}>
                        <Text style={styles.kungaharaStepTitle}>Collect Inputs</Text>
                        <Text style={styles.kungaharaStepDescription}>Use your digital ID to claim the fertilizers and tools allocated for your farm size.</Text>
                      </View>
                    </View>
                    <View style={styles.kungaharaStep}>
                      <Text style={styles.kungaharaBullet}>•</Text>
                      <View style={styles.kungaharaStepCopy}>
                        <Text style={styles.kungaharaStepTitle}>Log Your Harvest</Text>
                        <Text style={styles.kungaharaStepDescription}>Deliver crops to the washing station, where your weight is digitally recorded and confirmed by SMS.</Text>
                      </View>
                    </View>
                    <View style={styles.kungaharaStep}>
                      <Text style={styles.kungaharaBullet}>•</Text>
                      <View style={styles.kungaharaStepCopy}>
                        <Text style={styles.kungaharaStepTitle}>Get Paid Digitally</Text>
                        <Text style={styles.kungaharaStepDescription}>Receive secure, direct payments into your Mobile Money account with a permanent digital record of your sales.</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </>
            )) : (
              <>
                <Text style={styles.programsHeading}>national programs for you</Text>
                <Text style={styles.programsIntro}>services below are services brought and trusted by government to help a farmer be more productive</Text>
                {nationalPrograms.map((program) => (
                  <Pressable
                    key={program.title}
                    accessibilityRole={program === nationalPrograms[0] || program === nationalPrograms[1] ? 'button' : 'link'}
                    onPress={() => {
                      if (program === nationalPrograms[0] || program === nationalPrograms[1]) {
                        setSelectedProgram(program);
                        setMessage('');
                        return;
                      }
                      void Linking.openURL(program.url).catch(() => setMessage('Could not open this program page. Please try again.'));
                    }}
                    style={({ pressed }) => [styles.programCard, pressed && styles.cardPressed]}>
                    <View style={styles.programCopy}>
                      <Text style={styles.programTitle}>{program.title}</Text>
                      <Text style={styles.programDescription}>{program.description}</Text>
                      <Text style={styles.programLink}>learn more →</Text>
                    </View>
                  </Pressable>
                ))}
              </>
            )}
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={selectedProgram ? 'Back to national programs' : 'Back to services'}
              onPress={() => {
                if (selectedProgram) {
                  setSelectedProgram(null);
                } else {
                  setShowNationalPrograms(false);
                }
                setMessage('');
              }}
              style={({ pressed }) => [styles.backLink, pressed && styles.cardPressed]}>
              <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={accent} size={17} />
              <Text style={styles.backLinkText}>Back</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
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
    if (selectedService.id === 'national-programs') {
      setShowNationalPrograms(true);
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
                    <Image source={service.image} style={styles.serviceImage} resizeMode="cover" accessibilityLabel={service.imageLabel} />
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
  programsHeading: { color: accent, fontSize: 23, lineHeight: 30, fontWeight: '800', textAlign: 'center', marginBottom: 18 },
  programsIntro: { color: ink, fontSize: 13, lineHeight: 19, textAlign: 'center', marginHorizontal: 8, marginBottom: 28 },
  programCard: { width: '82%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BEBEBE', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 14, minHeight: 108 },
  programCopy: { alignItems: 'center', gap: 4 },
  programTitle: { color: accent, fontSize: 17, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  programDescription: { color: '#292929', fontSize: 13, lineHeight: 17, textAlign: 'center' },
  programLink: { color: '#2674D9', fontSize: 13, lineHeight: 18, fontWeight: '400', textAlign: 'center', marginTop: 2 },
  smartTitle: { color: accent, fontSize: 24, lineHeight: 31, fontWeight: '800', textAlign: 'center', marginTop: 17, marginBottom: 18 },
  smartIntro: { color: ink, fontSize: 15, lineHeight: 20, fontWeight: '400', textAlign: 'center', marginHorizontal: 9 },
  smartWebsiteLink: { alignSelf: 'center', marginTop: 19, marginBottom: 10, paddingVertical: 3, paddingHorizontal: 6 },
  smartWebsiteText: { color: '#2674D9', fontSize: 14, lineHeight: 20, fontWeight: '400', textAlign: 'center', textDecorationLine: 'none' },
  smartActions: { alignItems: 'center', gap: 12, marginTop: 1 },
  smartActionButton: { width: '52%', minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#55AD2E', paddingHorizontal: 12 },
  smartUssdButton: { backgroundColor: '#72B94D' },
  smartActionText: { color: '#FFFFFF', fontSize: 14, lineHeight: 19, textAlign: 'center' },
  smartHowItWorks: { width: '82%', alignSelf: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BEBEBE', borderRadius: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18, marginTop: 32, marginBottom: 8 },
  smartHowTitle: { color: accent, fontSize: 20, lineHeight: 27, fontWeight: '800', textAlign: 'center', marginBottom: 18 },
  kungaharaActions: { marginTop: 24 },
  kungaharaHowItWorks: { marginTop: 28, paddingHorizontal: 24, paddingTop: 23 },
  kungaharaSteps: { gap: 8 },
  kungaharaStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  kungaharaBullet: { width: 10, color: ink, fontSize: 13, lineHeight: 16 },
  kungaharaStepCopy: { flex: 1 },
  kungaharaStepTitle: { color: ink, fontSize: 12, lineHeight: 15, fontWeight: '700' },
  kungaharaStepDescription: { color: ink, fontSize: 12, lineHeight: 15, marginLeft: 9 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  serviceCard: {
    width: '48.5%',
    minHeight: 190,
    padding: 10,
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
    marginBottom: 8,
  },
  serviceImage: {
    width: 48,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#EAF4E6',
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
