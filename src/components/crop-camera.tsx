import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CropCameraProps = {
  onBack: () => void;
  onPhotoSelected: (uri: string) => void;
};

export default function CropCamera({ onBack, onPhotoSelected }: CropCameraProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [message, setMessage] = useState('');

  async function takePhoto() {
    if (!cameraReady || !cameraRef.current || takingPhoto) return;
    setTakingPhoto(true);
    setMessage('');
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (picture?.uri) onPhotoSelected(picture.uri);
    } catch {
      setMessage('Could not take a photo. Please try again.');
    } finally {
      setTakingPhoto(false);
    }
  }

  async function uploadPhoto() {
    setMessage('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });
      if (!result.canceled) onPhotoSelected(result.assets[0].uri);
    } catch {
      setMessage('Could not open your photos. Please try again.');
    }
  }

  async function enableCamera() {
    setMessage('');
    const result = await requestPermission();
    if (!result.granted) setMessage('Camera access is off. You can upload a crop photo instead.');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to services"
          onPress={onBack}
          style={styles.backButton}>
          <SymbolView
            name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor="#1D2B23"
            size={20}
          />
        </Pressable>
        <Image
          source={require('../../assets/images/logo/gof logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="GOF+ logo"
        />
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>CROP DIAGNOSIS</Text>
          <Text style={styles.title}>Capture the affected area</Text>
        </View>
      </View>

      <View style={styles.preview}>
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            mode="picture"
            onCameraReady={() => setCameraReady(true)}
            onMountError={(event) => setMessage(event.message)}
          />
        ) : (
          <View style={styles.permissionPanel}>
            {permission ? (
              <>
                <Text style={styles.permissionTitle}>Allow camera access</Text>
                <Text style={styles.permissionText}>
                  Use the back camera to photograph the affected crop area.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={enableCamera}
                  style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}>
                  <Text style={styles.permissionButtonText}>Enable camera</Text>
                </Pressable>
              </>
            ) : (
              <ActivityIndicator color="#FFFFFF" />
            )}
          </View>
        )}
        {permission?.granted && !cameraReady ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.loadingText}>Starting camera…</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>Frame one affected leaf or area in natural light.</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={uploadPhoto}
            style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'photo', android: 'photo_library', web: 'photo_library' }}
              tintColor="#5DAC2C"
              size={20}
            />
            <Text style={styles.uploadText}>Upload photo</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take crop photo"
            disabled={!cameraReady || takingPhoto}
            onPress={takePhoto}
            style={({ pressed }) => [
              styles.shutter,
              (!cameraReady || takingPhoto) && styles.shutterDisabled,
              pressed && styles.pressed,
            ]}>
            {takingPhoto ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </Pressable>
          <View style={styles.actionSpacer} />
        </View>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
  },
  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
  },
  logo: {
    width: 66,
    height: 42,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#EFF4EB',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: '#66736A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#1D2B23',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },
  preview: {
    flex: 1,
    minHeight: 260,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#23342A',
  },
  camera: {
    flex: 1,
  },
  permissionPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  permissionText: {
    maxWidth: 300,
    color: '#D7E0D9',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  permissionButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: '#5DAC2C',
    marginTop: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#14201999',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  footer: {
    paddingTop: 15,
  },
  hint: {
    color: '#66736A',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  actions: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadButton: {
    minHeight: 46,
    minWidth: 124,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#5DAC2C',
    borderRadius: 9,
  },
  uploadText: {
    color: '#1D2B23',
    fontSize: 12,
    fontWeight: '700',
  },
  shutter: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1D2B23',
    borderRadius: 33,
  },
  shutterInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5DAC2C',
  },
  shutterDisabled: {
    opacity: 0.42,
  },
  actionSpacer: {
    width: 124,
  },
  pressed: {
    opacity: 0.78,
  },
  message: {
    color: '#A33F32',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 8,
  },
});
