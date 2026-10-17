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

export async function saveDiagnosisRecord(diagnosis: CropDiagnosis): Promise<DiagnosisRecord> {
  const record: DiagnosisRecord = {
    ...diagnosis,
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
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
