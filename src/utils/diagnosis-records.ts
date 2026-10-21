import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export type CropDiagnosis = {
  plantName: string;
  scientificName: string;
  plantConfidence: number;
  likelyIssue: string;
  issueConfidence: number;
  observations: string[];
  recommendations: string[];
  caution: string;
};

export type DiagnosisRecord = CropDiagnosis & {
  id: string;
  createdAt: string;
  photoUri: string | null;
};

const webStorageKey = 'gof.crop-diagnosis-records';
const nativeRecordsFile = () => new File(Paths.document, 'crop-diagnosis-records.json');

export async function loadDiagnosisRecords(): Promise<DiagnosisRecord[]> {
  try {
    const serialized = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(webStorageKey)
      : nativeRecordsFile().exists
        ? await nativeRecordsFile().text()
        : null;
    if (!serialized) return [];
    const records: unknown = JSON.parse(serialized);
    return Array.isArray(records) ? records as DiagnosisRecord[] : [];
  } catch {
    return [];
  }
}

async function persistPhoto(photoUri: string, id: string): Promise<string> {
  if (Platform.OS === 'web') {
    if (photoUri.startsWith('data:')) return photoUri;
    const response = await fetch(photoUri);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not save diagnosis photo.'));
      reader.onerror = () => reject(reader.error ?? new Error('Could not save diagnosis photo.'));
      reader.readAsDataURL(blob);
    });
  }

  const extension = photoUri.split('?')[0].toLowerCase().endsWith('.png') ? 'png' : 'jpg';
  const destination = new File(Paths.document, `diagnosis-${id}.${extension}`);
  await new File(photoUri).copy(destination);
  return destination.uri;
}

export async function saveDiagnosisRecord(diagnosis: CropDiagnosis, photoUri: string): Promise<DiagnosisRecord> {
  const id = `${Date.now()}`;
  let savedPhotoUri: string | null = null;
  try {
    savedPhotoUri = await persistPhoto(photoUri, id);
  } catch {
    // Keep the diagnosis even if the temporary photo cannot be copied.
  }
  const record: DiagnosisRecord = {
    ...diagnosis,
    id,
    createdAt: new Date().toISOString(),
    photoUri: savedPhotoUri,
  };
  const records = [record, ...(await loadDiagnosisRecords())].slice(0, 50);
  const serialized = JSON.stringify(records);

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(webStorageKey, serialized);
  } else {
    const file = nativeRecordsFile();
    if (!file.exists) file.create();
    await file.write(serialized);
  }

  return record;
}
