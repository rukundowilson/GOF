export type SoilAnalysisResult = {
  labResultsAnalysis?: string;
  /** Kept to display soil analyses saved before the lab-only workflow. */
  soilAnalysisFromImage?: string;
  soilPropertiesAnalysis?: string;
  districtAnalysis: string;
  weatherForecast: string;
  siteAltitude?: number | null;
  dataSources?: string[];
  districtContext: {
    district: string;
    province: string;
    minAltitude: number;
    maxAltitude: number;
    avgAltitude: number;
    topography: string;
  } | null;
  seedRecommendations: {
    crop: string;
    variety: string;
    reason: string;
    maturity: string;
    yieldPotential: string;
    sourcePage: string;
    supportiveEvidence: string[];
  }[];
  cautions: string[];
};

export type SoilMeasurements = {
  ph: string;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  organicMatter: string;
  texture: string;
  /** Legacy property retained for older locally saved analyses. */
  moisture?: string;
};

export type SoilSampleMetadata = { labName: string; sampleId: string; sampleDate: string };

export type SoilAnalysisRecord = {
  id: string;
  createdAt: string;
  photoUri: string | null;
  locationLabel: string;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  soilValues: SoilMeasurements;
  sampleMetadata?: SoilSampleMetadata;
  result: SoilAnalysisResult;
};
