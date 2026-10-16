import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  background: '#F3F6F0',
  ink: '#1D2B23',
  muted: '#66736A',
  forest: '#1E4935',
  forestDark: '#173A2B',
  lime: '#D5E7A2',
  line: '#DCE4DA',
};

const benefits = [
  'Understand crop problems from a photo',
  'Get input guidance shaped by local weather',
  'Connect with agricultural consultants',
];

export default function HomeScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function getStarted() {
    setError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });
      if (!result.canceled) setPhotoUri(result.assets[0].uri);
    } catch {
      setError('Could not open your photos. Please try again.');
    }
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

          <Text style={styles.eyebrow}>FIELD SUPPORT, MADE PRACTICAL</Text>
          <Text style={styles.title}>Welcome to GOF</Text>
          <Text style={styles.description}>
            Clearer answers for healthier crops and confident decisions in the field.
          </Text>

          <View style={styles.benefits}>
            {benefits.map((benefit, index) => (
              <View key={benefit} style={styles.benefitRow}>
                <View style={styles.benefitNumber}>
                  <Text style={styles.benefitNumberText}>0{index + 1}</Text>
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {photoUri ? (
            <View style={styles.photoResult}>
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              <Text style={styles.photoCaption}>Your crop photo is ready for the next step.</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={getStarted}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>{photoUri ? 'Choose another photo' : 'Get started'}</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.footnote}>Start with a photo of your crop.</Text>
        </View>
      </ScrollView>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.select({ web: 80, default: 12 }),
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
    marginBottom: 26,
  },
  eyebrow: {
    color: colors.forest,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    color: colors.muted,
    maxWidth: 360,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 10,
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
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  benefitText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 20,
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
    backgroundColor: colors.forestDark,
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
    color: colors.lime,
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
});
