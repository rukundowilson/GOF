export type SoilAnalysisResult = {
  soilAnalysisFromImage: string;
  soilPropertiesAnalysis: string;
  districtAnalysis: string;
  weatherForecast: string;
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

export type SoilMeasurements = { ph: string; nitrogen: string; moisture: string };

export type SoilAnalysisRecord = {
  id: string;
  createdAt: string;
  photoUri: string | null;
  locationLabel: string;
  latitude: number;
  longitude: number;
  soilValues: SoilMeasurements;
  result: SoilAnalysisResult;
};
