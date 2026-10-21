import ServiceSelection from '@/components/service-selection';
import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FieldLocation } from '@/utils/field-location';

const colors = {
  background: '#FFFFFF',
  ink: '#1D2B23',
  muted: '#66736A',
  forest: '#1E4935',
  forestDark: '#173A2B',
  accent: '#5DAC2C',
  lime: '#D5E7A2',
  line: '#DCE4DA',
};

const benefits = [
  {
    title: 'Diagnose crop emergencies',
    description: 'Find the cause and prescribe targeted, affordable treatment.',
  },
  {
    title: 'Plan soil and fertilizer',
    description: 'Use soil tests to choose the right fertilizer.',
  },
  {
    title: 'Choose seeds and planting times',
    description: 'Choose seeds for local weather and soil.',
  },
  {
    title: 'Modernize farming',
    description: 'Use drones, GPS, and smart irrigation.',
  },
  {
    title: 'Adapt to climate change',
    description: 'Change planting times and choose drought-ready crops.',
  },
];

export default function HomeScreen() {
  const [showServices, setShowServices] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [fieldLocation, setFieldLocation] = useState<FieldLocation | null>(null);

  function handleGetStarted() {
    if (fieldLocation) {
      setShowServices(true);
      return;
    }
    setLocationError('');
    setShowLocationPrompt(true);
  }

  async function handleUseLocation() {
    setRequestingLocation(true);
    setLocationError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError('Location access was not allowed. You can continue without it.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      let label = 'Current location';
      if (Platform.OS !== 'web') {
        try {
          const places = await Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          const place = places[0];
          const area = place?.district || place?.city || place?.subregion || place?.region;
          if (area) label = `${area}, ${place?.isoCountryCode || 'RW'}`;
        } catch {
          // The coordinates are still useful if a place name is unavailable.
        }
      }

      setFieldLocation({
        label,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
      });
      setShowLocationPrompt(false);
      setShowServices(true);
    } catch {
      setLocationError('Could not get your location. Check location services or continue without it.');
    } finally {
      setRequestingLocation(false);
    }
  }

  function continueWithoutLocation() {
    setFieldLocation(null);
    setShowLocationPrompt(false);
    setShowServices(true);
  }

  if (showServices) {
    return (
      <ServiceSelection
        location={fieldLocation}
        onBack={() => setShowServices(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Image
            source={require('../../assets/images/logo/gof logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="GOF logo"
          />

          <Text style={styles.title}>Your AI Agronomist</Text>

          <View style={styles.benefits}>
            {benefits.map((benefit, index) => (
              <View key={benefit.title} style={styles.benefitRow}>
                <View style={styles.benefitNumber}>
                  <Text style={styles.benefitNumberText}>0{index + 1}</Text>
                </View>
                <View style={styles.benefitTextWrap}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>{benefit.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleGetStarted}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>Get started</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </Pressable>
        </View>
      </ScrollView>
      {showLocationPrompt ? (
        <View style={styles.promptOverlay}>
          <View accessibilityRole="alert" style={styles.locationPrompt}>
            <View style={styles.promptIcon}>
              <SymbolView
                name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                tintColor={colors.accent}
                size={25}
              />
            </View>
            <Text style={styles.promptTitle}>Use your current location?</Text>
            <Text style={styles.promptDescription}>
              Location helps tailor field advice to where you grow. GOF only reads it after you allow access.
            </Text>
            {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={requestingLocation}
              onPress={() => void handleUseLocation()}
              style={({ pressed }) => [styles.allowButton, pressed && styles.buttonPressed]}>
              {requestingLocation ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.allowButtonText}>Use my location</Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={requestingLocation}
              onPress={continueWithoutLocation}
              style={({ pressed }) => [styles.skipButton, pressed && styles.buttonPressed]}>
              <Text style={styles.skipButtonText}>Continue without location</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.select({ web: 80, default: 40 }),
    paddingBottom: 32,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 156,
    height: 106,
    marginBottom: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  benefits: {
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    marginTop: 30,
    marginBottom: 26,
    paddingVertical: 8,
  },
  benefitRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 9,
  },
  benefitNumber: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#E2EBDD',
  },
  benefitNumberText: {
    color: colors.forest,
    fontSize: 10,
    fontWeight: '800',
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitTitle: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  benefitDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  photoResult: {
    width: '100%',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.line,
  },
  photoCaption: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 7,
  },
  button: {
    width: '100%',
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 22,
  },
  error: {
    color: '#A33F32',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  footnote: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 14,
  },
  promptOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
    backgroundColor: 'rgba(22, 35, 27, 0.38)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  locationPrompt: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 22,
    shadowColor: '#14251A',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  promptIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF4E6',
    marginBottom: 14,
  },
  promptTitle: { color: colors.ink, fontSize: 20, lineHeight: 27, fontWeight: '800' },
  promptDescription: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  locationError: { color: '#A33F32', fontSize: 12, lineHeight: 18, marginTop: 10 },
  allowButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.accent,
    marginTop: 18,
  },
  allowButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  skipButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  skipButtonText: { color: colors.forest, fontSize: 13, fontWeight: '700' },
});
