import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const MAX_IMAGE_SIZE_BYTES = 14 * 1024 * 1024;
const GEMINI_REQUEST_TIMEOUT_MS = 180_000;
const acceptedImageTypes = new Set(['image/jpeg', 'image/png']);
const model = 'gemini-3.8-flash';
const fallbackModel = 'gemini-3.6-flash';
const finalFallbackModel = 'gemini-3.5-flash-lite';

type GeminiDiagnosis = {
  plantName: string;
  scientificName: string;
  plantConfidence: number;
  likelyIssue: string;
  issueConfidence: number;
  observations: string[];
  recommendations: string[];
  caution: string;
};

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isGeminiDiagnosis(value: unknown): value is GeminiDiagnosis {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.plantName === 'string' &&
    typeof result.scientificName === 'string' &&
    typeof result.plantConfidence === 'number' &&
    typeof result.likelyIssue === 'string' &&
    typeof result.issueConfidence === 'number' &&
    Array.isArray(result.observations) &&
    result.observations.every((item) => typeof item === 'string') &&
    Array.isArray(result.recommendations) &&
    result.recommendations.every((item) => typeof item === 'string') &&
    typeof result.caution === 'string'
  );
}

function getHttpStatus(error: unknown) {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null;
  return typeof error.status === 'number' ? error.status : null;
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
  if (!apiKey) {
    return errorResponse('The crop analysis service is not configured. Please try again later.', 503);
  }

  let submittedImage: FormDataEntryValue | null;
  try {
    const form = (await request.formData()) as unknown as {
      get: (name: string) => FormDataEntryValue | null;
    };
    submittedImage = form.get('image');
  } catch {
    return errorResponse('The uploaded image could not be read.', 400);
  }

  if (!(submittedImage instanceof File)) {
    return errorResponse('Upload one crop photo to analyze.', 400);
  }
  if (!acceptedImageTypes.has(submittedImage.type)) {
    return errorResponse('Use a JPG or PNG image.', 415);
  }
  if (submittedImage.size > MAX_IMAGE_SIZE_BYTES) {
    return errorResponse('Choose an image smaller than 14 MB.', 413);
  }

  const imageBase64 = arrayBufferToBase64(await submittedImage.arrayBuffer());
  const prompt = [
    'Analyze this crop photo. Identify the plant and any visible pest, disease, or crop stress.',
    'Return only the requested JSON fields.',
    'Write in plain, simple English for Rwandan agronomists. Use short sentences. Avoid hard words or explain them simply.',
    'If unsure about the plant, say "Unclear from this photo" and give a low confidence score.',
    'Describe only what you can see. Give the most likely cause, but do not say a disease or pest is confirmed from a photo alone.',
    'If you cannot see a clear problem, do not invent one. Say "No clear problem visible" and suggest simple field checks for water, drainage, soil nutrients, and recent weather.',
    'Make recommendations the main advice. Put the single most useful action first. Give practical treatment steps, including watering, drainage, crop care, or a chemical option when suitable.',
    'Only suggest a chemical when visible signs strongly support a specific pest or disease and issueConfidence is at least 0.75. Name the target pest or disease and active ingredient. You may name a product brand such as Rocket only if you know the exact product formulation and that its current Rwanda label allows use on this crop and target. Rocket is an example, not a default. Product names and formulations can differ. Never guess a product, dose, mix, or spray interval. If unsure, tell the agronomist to check the current RICA/RAB register and product label.',
    'For any chemical advice, say to follow the label for dose, protective equipment, and the waiting time before harvest. Do not suggest a general "insect killer".',
    'When confidence is low, suggest safe non-chemical actions and what to check next. Ask for support from another agronomist if the problem is severe, spreading, or unclear.',
    'Confidence values must be between 0 and 1.',
  ].join(' ');

  const generationConfig = {
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'OBJECT',
      properties: {
        plantName: { type: 'STRING' },
        scientificName: { type: 'STRING' },
        plantConfidence: { type: 'NUMBER' },
        likelyIssue: { type: 'STRING' },
        issueConfidence: { type: 'NUMBER' },
        observations: { type: 'ARRAY', items: { type: 'STRING' } },
        recommendations: { type: 'ARRAY', items: { type: 'STRING' } },
        caution: { type: 'STRING' },
      },
      required: [
        'plantName',
        'scientificName',
        'plantConfidence',
        'likelyIssue',
        'issueConfidence',
        'observations',
        'recommendations',
        'caution',
      ],
    },
    maxOutputTokens: 1200,
  } as const;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: GEMINI_REQUEST_TIMEOUT_MS,
        retryOptions: { attempts: 1 },
        fetch: (input, init) => fetch(input, {
          ...init,
          connectTimeout: GEMINI_REQUEST_TIMEOUT_MS,
        } as RequestInit & { connectTimeout: number }),
      },
    });

    let result: Awaited<ReturnType<typeof ai.models.generateContent>> | undefined;
    let lastError: unknown;
    for (const modelName of [model, fallbackModel, finalFallbackModel]) {
      try {
        result = await ai.models.generateContent({
          model: modelName,
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: submittedImage.type, data: imageBase64 } },
            ],
          }],
          config: generationConfig,
        });
        break;
      } catch (error) {
        lastError = error;
        if (getHttpStatus(error) !== 503 || modelName === finalFallbackModel) throw error;
      }
    }
    if (!result) {
      if (lastError) throw lastError;
      return errorResponse('No crop analysis was returned. Please try again.', 502);
    }

    const generatedText = result.text;
    if (!generatedText) {
      return errorResponse('No crop analysis was returned. Try a clearer crop photo.', 502);
    }

    let diagnosis: unknown;
    try {
      diagnosis = JSON.parse(generatedText);
    } catch {
      return errorResponse('The crop analysis could not be read. Please try again.', 502);
    }
    if (!isGeminiDiagnosis(diagnosis)) {
      return errorResponse('The crop analysis was incomplete. Please try again.', 502);
    }

    return Response.json(diagnosis);
  } catch (error) {
    console.error('[crop-analysis] Gemini request failed', error);
    const status = getHttpStatus(error);
    if (status === 401 || status === 403) {
      return errorResponse('The crop analysis service could not authenticate. Please contact support.', 502);
    }
    if (status === 429) {
      return errorResponse('The crop analysis service is busy. Please try again shortly.', 429);
    }
    if (status === 503) {
      return errorResponse('The crop analysis service is temporarily unavailable. Please try again shortly.', 503);
    }
    return errorResponse(
      'Could not reach the crop analysis service after several attempts. Please try again shortly.',
      502,
    );
  }
}
