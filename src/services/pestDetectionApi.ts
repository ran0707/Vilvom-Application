// API service for pest detection
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

// Note: This service now uses the backend API (port 5000) instead of connecting 
// directly to the AI service (port 8000). The backend forwards requests to the AI service.
const PEST_DETECTION_URL = `${API_BASE_URL}${API_ENDPOINTS.PEST.DETECT}`;

// Helper function to get auth token from storage
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.warn('Could not get auth token:', error);
    return null;
  }
};

export interface PestDetectionResult {
  _id?: string | null;
  prediction: string;
  confidence: number;
  bounding_box: number[];
  symptoms: string[];
  biological_control: string[];
  chemical_control: string[];
  mechanical_control: string[];
  processed_image: string;
}

export const detectPest = async (
  imageUri: string,
  coords?: { lat: number; lng: number },
): Promise<PestDetectionResult> => {
  try {
    console.log('[pestDetectionApi] detectPest - start', {
      imageUri,
      url: PEST_DETECTION_URL,
    });
    // Quick server reachability check to fail fast when backend isn't running or reachable
    const checkServerAlive = async (timeoutMs = 4000) => {
      const urlsToTry = [`${API_BASE_URL}/health`, `${API_BASE_URL}/`];
      for (const u of urlsToTry) {
        try {
          const controller =
            typeof AbortController !== 'undefined'
              ? new AbortController()
              : null;
          const signal = controller ? controller.signal : undefined;
          const timeoutId = setTimeout(() => controller?.abort(), timeoutMs);
          const r = await fetch(u, { method: 'GET', signal });
          clearTimeout(timeoutId);
          if (r && (r.ok || r.status === 404)) return true;
        } catch (err) {
          // try next
          continue;
        }
      }
      return false;
    };

    const alive = await checkServerAlive();
    if (!alive) {
      const msg = `Backend API unreachable at ${API_BASE_URL} — make sure the backend server is running on port 5000. The backend will forward requests to the AI service on port 8000.`;
      console.error('[pestDetectionApi] server unreachable check failed:', msg);
      throw new Error(msg);
    }
    // Create form data for the image
    const formData = new FormData();

    // Normalize filename and mime type from the uri where possible
    let filename = 'pest_image.jpg';
    try {
      const parts = (imageUri || '').split('/');
      const last = parts[parts.length - 1];
      if (last && last.length > 0) filename = last.split('?')[0];
    } catch (e) {
      // leave default
    }

    // Ensure filename has proper extension for validation
    if (!filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
      console.warn('[pestDetectionApi] Filename missing extension, adding .jpg:', filename);
      filename = filename + '.jpg';
    }

    let mimeType = 'image/jpeg';
    if (/\.png($|\?)/i.test(filename)) mimeType = 'image/png';
    else if (/\.jpg($|\?)/i.test(filename) || /\.jpeg($|\?)/i.test(filename))
      mimeType = 'image/jpeg';
    else if (/\.webp($|\?)/i.test(filename)) mimeType = 'image/webp';

    console.log('[pestDetectionApi] Image data to send:', {
      uri: imageUri.substring(0, 50) + '...',
      filename: filename,
      mimeType: mimeType,
    });

    const imageData = {
      uri: imageUri,
      type: mimeType,
      name: filename,
    } as any;

    // Backend expects field name 'image', not 'file'
    formData.append('image', imageData);

    // Include location as JSON string so backend saves it directly on the detection record
    if (coords?.lat && coords?.lng) {
      formData.append('location', JSON.stringify({
        type: 'Point',
        coordinates: [coords.lng, coords.lat],
      }));
    }

    console.log('[pestDetectionApi] FormData prepared with field "image"');

    // Use a timeout to avoid indefinite hangs
    const makeRequest = async (timeoutMs = 60000) => {
      const controller =
        typeof AbortController !== 'undefined' ? new AbortController() : null;
      const signal = controller ? controller.signal : undefined;

      // Get auth token for authenticated requests
      const token = await getAuthToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('[pestDetectionApi] Using auth token:', token.substring(0, 20) + '...');
      } else {
        console.log('[pestDetectionApi] No auth token found, sending anonymous request');
      }

      console.log('[pestDetectionApi] Sending POST request to:', PEST_DETECTION_URL);
      console.log('[pestDetectionApi] Request headers:', headers);

      const fetchPromise = fetch(PEST_DETECTION_URL, {
        method: 'POST',
        // let fetch set the Content-Type with boundary for multipart requests
        headers,
        body: formData,
        signal,
      });

      const timeoutPromise = new Promise<Response>((_, rej) =>
        setTimeout(() => {
          try {
            controller?.abort();
          } catch (e) {
            /* ignore */
          }
          rej(new Error(`Request timed out after ${timeoutMs}ms`));
        }, timeoutMs),
      );

      return (await Promise.race([fetchPromise, timeoutPromise])) as Response;
    };

    // First attempt (60s). If it times out or fails, try once more (longer) before giving up.
    let response: Response | null = null;
    try {
      response = await makeRequest(60000);
    } catch (err) {
      console.warn(
        '[pestDetectionApi] first attempt failed, retrying once',
        err,
      );
      try {
        // second attempt with longer timeout
        response = await makeRequest(90000);
      } catch (err2) {
        const detailed = new Error(
          `Pest detection requests failed after retry: ${
            (err2 && (err2 as any).message) || String(err2)
          }. Ensure the backend API at ${API_BASE_URL} is running on port 5000. The backend will communicate with the AI service on port 8000.`,
        );
        console.error('[pestDetectionApi] retry failed', err2);
        throw detailed;
      }
    }

    console.log('[pestDetectionApi] ===== RESPONSE RECEIVED =====');
    console.log('[pestDetectionApi] Response status:', response.status);
    console.log('[pestDetectionApi] Response ok?:', response.ok);
    console.log('[pestDetectionApi] Response statusText:', response.statusText);
    console.log('[pestDetectionApi] Response headers:', response.headers);
    
    if (!response.ok) {
      const text = await response.text().catch(() => '<no body>');
      console.error('[pestDetectionApi] ===== ERROR RESPONSE =====');
      console.error('[pestDetectionApi] Status:', response.status);
      console.error('[pestDetectionApi] Status Text:', response.statusText);
      console.error('[pestDetectionApi] Response body:', text);
      console.error('[pestDetectionApi] ===== END ERROR =====');
      
      // Try to parse error message from backend
      let errorMessage = `Failed to detect pest: ${response.status}`;
      try {
        const errorData = JSON.parse(text);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If not JSON, use the text directly if it's short
        if (text && text.length < 200) {
          errorMessage = text;
        }
      }
      
      throw new Error(errorMessage);
    }

    console.log('[pestDetectionApi] ===== PARSING RESPONSE =====');
    let result: any;
    try {
      result = await response.json();
      console.log('[pestDetectionApi] Successfully parsed JSON response');
    } catch (parseErr) {
      const txt = await response.text().catch(() => '<unreadable>');
      console.error('[pestDetectionApi] JSON parse error, response text:', txt);
      throw parseErr;
    }

    console.log('[pestDetectionApi] Result keys:', Object.keys(result || {}));
    console.log('[pestDetectionApi] Full result:', JSON.stringify(result, null, 2));
    
    // Backend returns: { success, detection: {...}, message }
    // Extract the detection object if it exists, otherwise use result directly
    const detectionData = result.detection || result;
    
    console.log('[pestDetectionApi] Detection data keys:', Object.keys(detectionData || {}));
    console.log('[pestDetectionApi] Detection data:', JSON.stringify(detectionData, null, 2));
    if (detectionData && typeof detectionData.processed_image === 'string') {
      console.log(
        '[pestDetectionApi] processed_image length',
        detectionData.processed_image.length,
      );
    }

    // Validate required fields
    if (!detectionData.pestName && !detectionData.prediction) {
      console.error('[pestDetectionApi] Missing pestName/prediction in response:', detectionData);
      throw new Error('Invalid response from server: missing pest detection data');
    }

    // Transform the API response to match our interface
    // Backend uses 'pestName', our interface expects 'prediction'
    return {
      _id: detectionData.id || detectionData._id || null,  // include DB id for later updates
      prediction: detectionData.pestName || detectionData.prediction || 'Unknown',
      confidence: detectionData.confidence || 0,
      bounding_box: detectionData.boundingBox || detectionData.bounding_box || [],
      symptoms: detectionData.symptoms || [],
      biological_control: detectionData.biological_control || [],
      chemical_control: detectionData.chemical_control || [],
      mechanical_control: detectionData.mechanical_control || [],
      processed_image: detectionData.processed_image || '',
    };
  } catch (error) {
    // Enhanced error logging
    console.error('[pestDetectionApi] Error details:', {
      message: (error as any)?.message,
      name: (error as any)?.name,
      stack: (error as any)?.stack,
      fullError: error,
    });
    
    // If network-related, provide actionable hint
    if (
      error instanceof TypeError &&
      (error as any).message === 'Network request failed'
    ) {
      console.error(
        '[pestDetectionApi] Network request failed. Ensure the backend API is running on port 5000. The backend will handle communication with the AI service on port 8000.',
      );
      throw new Error(
        'Network error: Cannot reach backend server. Please check your connection and ensure the backend is running on port 5000.'
      );
    }
    
    throw error;
  }
};
