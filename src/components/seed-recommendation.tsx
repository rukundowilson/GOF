import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FieldLocation } from '@/utils/field-location';
import SoilAnalysisScreen from '@/components/soil-analysis';

const accent = '#5DAC2C';
const ink = '#1D2B23';
const muted = '#66736A';

export default function SeedRecommendation({
  onBack,
  location,
}: {
  onBack: () => void;
  location: FieldLocation | null;
}) {
  const [showSoilAnalysis, setShowSoilAnalysis] = useState(false);

  if (showSoilAnalysis) {
    return <SoilAnalysisScreen fieldLocation={location} onBack={() => setShowSoilAnalysis(false)} />;
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
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>Pre-Season Analysis</Text>
            <Text style={styles.description}>
              Review your soil laboratory results with your location, district terrain, and available weather information to guide decisions before planting. Seed recommendations use varieties registered in Rwanda.
            </Text>
            <Text style={styles.sourceText}>
              Sources: RICA Rwanda Plant Variety List 2025, Rwanda district topography dataset, and Meteo Rwanda Weather Forecast for October 2026.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowSoilAnalysis(true)}
              style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to services"
            onPress={onBack}
            style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.select({ web: 64, default: 8 }),
    paddingBottom: 30,
  },
  content: { width: '100%', maxWidth: 780, alignSelf: 'center', flex: 1 },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: { width: 105, height: 58 },
  locationPill: {
    maxWidth: '52%',
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 18,
    backgroundColor: '#F5F8F4',
    paddingHorizontal: 10,
  },
  locationText: { color: muted, fontSize: 11, fontWeight: '600', flexShrink: 1 },
  intro: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingTop: 92, paddingHorizontal: 8 },
  title: { color: '#111A14', fontSize: 20, lineHeight: 26, fontWeight: '800', textAlign: 'center' },
  description: { color: ink, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 24 },
  sourceText: { color: muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 16 },
  continueButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    alignSelf: 'center',
    borderRadius: 10,
    backgroundColor: accent,
    marginTop: 28,
    paddingHorizontal: 18,
  },
  continueText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  backLink: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 8,
  },
  backLinkText: { color: accent, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.82 },
});
