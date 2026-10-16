import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
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

const accent = '#5DAC2C';
const ink = '#1D2B23';
const muted = '#66736A';

type Service = {
  id: string;
  title: string;
  description: string;
  status: string;
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
    status: 'Start here',
    ready: true,
    icon: { ios: 'leaf.fill', android: 'agriculture', web: 'agriculture' },
    iconColor: '#26844A',
    iconBackground: '#E8F5EC',
  },
  {
    id: 'weather',
    title: 'Weather',
    description: 'Local forecasts for field decisions.',
    status: 'Coming soon',
    ready: false,
    icon: { ios: 'cloud.sun.rain.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' },
    iconColor: '#D39A18',
    iconBackground: '#FFF5DE',
  },
  {
    id: 'agronomists',
    title: 'Agronomists',
    description: 'Connect with nearby crop experts.',
    status: 'Coming soon',
    ready: false,
    icon: { ios: 'person.2.fill', android: 'support_agent', web: 'support_agent' },
    iconColor: '#277C85',
    iconBackground: '#E8F5F5',
  },
  {
    id: 'seasonal',
    title: 'Seasonal guidance',
    description: 'Plan the right work for the season.',
    status: 'Coming soon',
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
  const [openingPicker, setOpeningPicker] = useState(false);

  async function continueWithService() {
    if (!selectedService) return;
    setMessage('');

    if (!selectedService.ready) {
      setMessage(`${selectedService.title} is coming soon.`);
      return;
    }

    setOpeningPicker(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });
      if (!result.canceled) setPhotoUri(result.assets[0].uri);
    } catch {
      setMessage('Could not open your photos. Please try again.');
    } finally {
      setOpeningPicker(false);
    }
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

          <Text style={styles.eyebrow}>YOUR FIELD SERVICES</Text>
          <Text style={styles.title}>What do you need help with?</Text>
          <Text style={styles.subtitle}>Choose a service to get started.</Text>

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
                  <Text style={[styles.status, service.ready ? styles.readyStatus : styles.soonStatus]}>
                    {service.status}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {photoUri ? (
            <View style={styles.photoResult}>
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              <Text style={styles.photoMessage}>
                Photo selected. Crop diagnosis will be the next step we build.
              </Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!selectedService || openingPicker}
            onPress={continueWithService}
            style={({ pressed }) => [
              styles.continueButton,
              (!selectedService || openingPicker) && styles.disabledButton,
              pressed && styles.buttonPressed,
            ]}>
            {openingPicker ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueText}>
                {selectedService ? `Continue with ${selectedService.title}` : 'Choose a service'}
              </Text>
            )}
            {!openingPicker ? <Text style={styles.arrow}>→</Text> : null}
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
  status: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 'auto',
    paddingTop: 9,
  },
  readyStatus: {
    color: '#32824B',
  },
  soonStatus: {
    color: '#758079',
  },
  photoResult: {
    marginTop: 16,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E8EEE8',
  },
  photoMessage: {
    color: muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
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
});
