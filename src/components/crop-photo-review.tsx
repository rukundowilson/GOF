import { useCallback, useEffect, useState } from 'react';
import { File as ExpoFile } from 'expo-file-system';
import type { CropDiagnosis } from '@/utils/diagnosis-records';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
    ActivityIndicator,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CropPhotoReviewProps = {
  photoUri: string;
  onRetake: () => void;
  onDone: () => void;
  onDiagnosis: (diagnosis: CropDiagnosis) => void;
};

const accent = '#5DAC2C';
const ink = '#1D2B23';
const muted = '#66736A';
type DiagnosisResponse = CropDiagnosis & {
  error?: string;
};

async function createImageFormData(photoUri: string) {
  const form = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(photoUri);
    if (!response.ok) throw new Error('Could not read this photo. Try another image.');
    const image = await response.blob();
    const mimeType = image.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const extension = mimeType === 'image/png' ? 'png' : 'jpg';
    form.append('image', image, `crop.${extension}`);
    return form;
  }

  const isPng = photoUri.split('?')[0].toLowerCase().endsWith('.png');
  const extension = isPng ? 'png' : 'jpg';
  const imageFile = new ExpoFile(photoUri);
  form.append('image', imageFile, `crop.${extension}`);

  // React Native's FormData.getParts() exposes ExpoFile as a { uri } object.
  // Expo's fetch serializer supports Blob/File entries, so expose the appended
  // file through entries() while retaining the native FormData instance.
  Object.defineProperty(form, 'entries', {
    configurable: true,
    value: function* () {
      yield ['image', imageFile as unknown as FormDataEntryValue];
    },
  });
  return form;
}

export default function CropPhotoReview({ photoUri, onRetake, onDone, onDiagnosis }: CropPhotoReviewProps) {
  const [identifying, setIdentifying] = useState(false);
  const [diagnosis, setDiagnosis] = useState<CropDiagnosis | null>(null);
  const [error, setError] = useState('');
  const scanPosition = useSharedValue(0);
  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanPosition.get() }],
  }));

  useEffect(() => {
    if (identifying) {
      scanPosition.set(withRepeat(
        withTiming(340, { duration: 1800, easing: Easing.linear }),
        -1,
        true,
      ));
    } else {
      cancelAnimation(scanPosition);
      scanPosition.set(0);
    }
    return () => cancelAnimation(scanPosition);
  }, [identifying, scanPosition]);

  const identifyPlant = useCallback(async () => {
    setIdentifying(true);
    setError('');
    setDiagnosis(null);
    try {
      const form = await createImageFormData(photoUri);
      const response = await fetch('/api/identify', {
        method: 'POST',
        body: form,
      });
      const payload = (await response.json()) as DiagnosisResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? 'Crop analysis is temporarily unavailable.');
      }
      setDiagnosis(payload);
      onDiagnosis(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Crop analysis is temporarily unavailable.',
      );
    } finally {
      setIdentifying(false);
    }
  }, [onDiagnosis, photoUri]);

  useEffect(() => {
    const requestTimer = setTimeout(() => void identifyPlant(), 0);
    return () => clearTimeout(requestTimer);
  }, [identifyPlant]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.brand}>GOF<Text style={styles.brandPlus}>+</Text></Text>
            <Text style={styles.step}>CROP DIAGNOSIS</Text>
          </View>

          <View style={styles.photoFrame}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            {identifying ? (
              <View pointerEvents="none" style={styles.scanOverlay}>
                <Animated.View style={[styles.scanLine, scanStyle]} />
              </View>
            ) : null}
          </View>

          <View style={styles.identifyButton}>
            {identifying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.identifyText}>
                {error ? 'Analysis failed' : diagnosis ? 'Analysis complete' : 'Analysis ready'}
              </Text>
            )}
          </View>

          {identifying ? <Text style={styles.analysisStatus}>Analyzing your photo…</Text> : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {diagnosis ? (
            <View style={styles.results}>
              <Text style={styles.resultsTitle}>Diagnosis and treatment plan</Text>
              <View style={styles.diagnosisSection}>
                <Text style={styles.sectionLabel}>CROP</Text>
                <View style={styles.diagnosisHeading}>
                  <Text style={styles.resultName}>{diagnosis.plantName}</Text>
                  <Text style={styles.score}>{Math.round(diagnosis.plantConfidence * 100)}%</Text>
                </View>
                {diagnosis.scientificName ? (
                  <Text style={styles.scientificName}>{diagnosis.scientificName}</Text>
                ) : null}
              </View>
              <View style={styles.diagnosisSection}>
                <Text style={styles.sectionLabel}>LIKELY PROBLEM</Text>
                <View style={styles.diagnosisHeading}>
                  <Text style={styles.resultName}>{diagnosis.likelyIssue}</Text>
                  <Text style={styles.score}>{Math.round(diagnosis.issueConfidence * 100)}%</Text>
                </View>
              </View>
              <View style={styles.primaryRecommendation}>
                <Text style={styles.primaryRecommendationLabel}>MAIN RECOMMENDATION</Text>
                <Text style={styles.primaryRecommendationText}>
                  {diagnosis.recommendations[0] ?? 'No safe treatment advice from this photo. Check the crop in the field before using a product.'}
                </Text>
              </View>
              {diagnosis.observations.length ? (
                <View style={styles.diagnosisSection}>
                  <Text style={styles.sectionLabel}>WHAT WE CAN SEE</Text>
                  {diagnosis.observations.map((item, index) => (
                    <Text key={`${index}-${item}`} style={styles.listItem}>• {item}</Text>
                  ))}
                </View>
              ) : null}
              {diagnosis.recommendations.length > 1 ? (
                <View style={styles.diagnosisSection}>
                  <Text style={styles.sectionLabel}>OTHER ACTIONS</Text>
                  {diagnosis.recommendations.slice(1).map((item, index) => (
                    <Text key={`${index}-${item}`} style={styles.listItem}>• {item}</Text>
                  ))}
                </View>
              ) : null}
              {diagnosis.caution ? <Text style={styles.disclaimer}>{diagnosis.caution}</Text> : null}
              <Text style={styles.disclaimer}>
                For chemicals, check the label for this crop and pest. Follow its dose, safety gear, and harvest waiting time. Ask another agronomist if the problem is unclear or getting worse.
              </Text>
            </View>
          ) : null}

          {error ? (
            <Pressable
              accessibilityRole="button"
              disabled={identifying}
              onPress={identifyPlant}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryText}>Try analysis again</Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={onRetake}
            style={({ pressed }) => [styles.secondaryButton, styles.retakeButton, pressed && styles.pressed]}>
            <Text style={styles.retakeText}>Retake photo</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onDone}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Done for now</Text>
          </Pressable>
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
    paddingTop: Platform.select({ web: 64, default: 12 }),
    paddingBottom: 32,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  header: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  brand: {
    color: ink,
    fontSize: 19,
    fontWeight: '900',
  },
  brandPlus: {
    color: accent,
  },
  step: {
    color: muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  photo: {
    width: '100%',
    height: 340,
    backgroundColor: '#E8EEE8',
  },
  photoFrame: {
    width: '100%',
    height: 340,
    overflow: 'hidden',
    borderRadius: 13,
    backgroundColor: '#E8EEE8',
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#C6FF75',
    opacity: 0.95,
    shadowColor: '#C6FF75',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 5,
  },
  identifyButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: accent,
    marginTop: 16,
  },
  identifyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  analysisStatus: {
    color: muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  retryText: {
    color: accent,
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  retakeButton: {
    marginTop: 4,
  },
  retakeText: {
    color: muted,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryText: {
    color: muted,
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
  error: {
    color: '#A33F32',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  results: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: 20,
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
  primaryRecommendation: {
    borderLeftWidth: 4,
    borderLeftColor: accent,
    borderRadius: 10,
    backgroundColor: '#EAF4E5',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  primaryRecommendationLabel: {
    color: '#34752A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  primaryRecommendationText: {
    color: ink,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    marginTop: 7,
  },
  diagnosisSection: {
    borderTopWidth: 1,
    borderColor: '#E5EAE3',
    paddingVertical: 12,
  },
  diagnosisHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 5,
  },
  sectionLabel: {
    color: muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  listItem: {
    color: ink,
    fontSize: 13,
    lineHeight: 19,
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
  scientificName: {
    color: muted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  familyName: {
    color: muted,
    fontSize: 11,
    marginTop: 2,
  },
  score: {
    flexShrink: 0,
    color: accent,
    fontSize: 14,
    fontWeight: '800',
  },
  disclaimer: {
    color: muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.78,
  },
});
