const MAX_IMAGE_SIZE_BYTES = 14 * 1024 * 1024;
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

function getGeminiErrorMessage(value: unknown) {
  if (typeof value !== 'object' || value === null || !('error' in value)) return null;
  const error = value.error;
  if (typeof error !== 'object' || error === null || !('message' in error)) return null;
  return typeof error.message === 'string' ? error.message : null;
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return errorResponse('Gemini is not configured. Add GEMINI_API_KEY to the server environment and restart Expo.', 503);
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

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: submittedImage.type, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
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
      temperature: 0.2,
      maxOutputTokens: 1200,
    },
  };

  try {
    const sendRequest = (modelName: string) =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

    let response: Response | undefined;
    for (const modelName of [model, fallbackModel, finalFallbackModel]) {
      response = await sendRequest(modelName);
      if (response.status !== 503) break;
    }
    if (!response) return errorResponse('Gemini did not return a response. Please try again.', 502);
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return errorResponse('Google rejected the Gemini API key. Check GEMINI_API_KEY and its API access.', 502);
      }
      if (response.status === 429) {
        return errorResponse('Gemini is temporarily rate limited. Please try again shortly.', 429);
      }
      if (response.status === 503) {
        return errorResponse('Gemini is experiencing high demand. Please try again shortly.', 503);
      }
      return errorResponse(
        getGeminiErrorMessage(payload) ?? 'Gemini could not analyze this photo. Please try again.',
        502,
      );
    }

    const candidates =
      typeof payload === 'object' && payload !== null && 'candidates' in payload && Array.isArray(payload.candidates)
        ? payload.candidates
        : [];
    const parts =
      candidates[0] && typeof candidates[0] === 'object' && 'content' in candidates[0] &&
      typeof candidates[0].content === 'object' && candidates[0].content !== null &&
      'parts' in candidates[0].content && Array.isArray(candidates[0].content.parts)
        ? candidates[0].content.parts
        : [];
    const textPart = parts.find(
      (part: unknown): part is { text: string } =>
        typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string',
    );
    if (!textPart) {
      return errorResponse('Gemini did not return an analysis. Try a clearer crop photo.', 502);
    }

    let diagnosis: unknown;
    try {
      diagnosis = JSON.parse(textPart.text);
    } catch {
      return errorResponse('Gemini returned an unreadable analysis. Please try again.', 502);
    }
    if (!isGeminiDiagnosis(diagnosis)) {
      return errorResponse('Gemini returned an incomplete analysis. Please try again.', 502);
    }

    return Response.json(diagnosis);
  } catch {
    return errorResponse('Could not reach the Gemini API. Check your connection and try again.', 502);
  }
}
