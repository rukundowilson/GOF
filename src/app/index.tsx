import ServiceSelection from '@/components/service-selection';
import { useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  if (showServices) {
    return <ServiceSelection onBack={() => setShowServices(false)} />;
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
            onPress={() => setShowServices(true)}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <Text style={styles.buttonText}>Get started</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </Pressable>
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
});
