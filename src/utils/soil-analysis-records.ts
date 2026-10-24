import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import type { SoilAnalysisRecord } from '@/utils/soil-analysis';

const storageKey = 'gof.soil-analysis-records';
const maxSavedRecords = 50;
const recordsFile = () => new File(Paths.document, 'soil-analysis-records.json');

export async function loadSoilAnalysisRecords(): Promise<SoilAnalysisRecord[]> {
  try {
    const serialized = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(storageKey)
      : recordsFile().exists
        ? await recordsFile().text()
        : null;
    if (!serialized) return [];
    const records: unknown = JSON.parse(serialized);
    return Array.isArray(records) ? records as SoilAnalysisRecord[] : [];
  } catch {
    return [];
  }
}

async function keepPhoto(photoUri: string, id: string): Promise<string> {
  if (Platform.OS === 'web') {
    if (photoUri.startsWith('data:')) return photoUri;
    const response = await fetch(photoUri);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not save soil photo.'));
      reader.onerror = () => reject(reader.error ?? new Error('Could not save soil photo.'));
      reader.readAsDataURL(blob);
    });
  }

  const extension = photoUri.split('?')[0].toLowerCase().endsWith('.png') ? 'png' : 'jpg';
  const destination = new File(Paths.document, `soil-analysis-${id}.${extension}`);
  await new File(photoUri).copy(destination);
  return destination.uri;
}

export async function saveSoilAnalysisRecord(
  recordData: Omit<SoilAnalysisRecord, 'id' | 'createdAt' | 'photoUri'> & { photoUri: string | null },
): Promise<SoilAnalysisRecord> {
  const id = `${Date.now()}`;
  let photoUri: string | null = null;
  if (recordData.photoUri) {
    try {
      photoUri = await keepPhoto(recordData.photoUri, id);
    } catch {
      photoUri = recordData.photoUri;
    }
  }

  const record: SoilAnalysisRecord = {
    ...recordData,
    id,
    createdAt: new Date().toISOString(),
    photoUri,
  };
  const records = [record, ...(await loadSoilAnalysisRecords()).filter((item) => item.id !== id)].slice(0, maxSavedRecords);
  const serialized = JSON.stringify(records);

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(storageKey, serialized);
  } else {
    const file = recordsFile();
    if (!file.exists) file.create();
    await file.write(serialized);
  }

  return record;
}
