import { NextRequest } from 'next/server';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Validate API Key from request headers
 * Checks X-API-Key or Authorization: Bearer headers
 */
export async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; userId?: string; error?: string }> {
  // Check for API key in headers
  const apiKey = request.headers.get('X-API-Key') || 
                 request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return { valid: false, error: 'No API key provided' };
  }

  // Check if it's an AiSign API key
  if (!apiKey.startsWith('aisign_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  try {
    // Search all user settings for this API key
    const settingsRef = collection(db, 'settings');
    const snapshot = await getDocs(settingsRef);
    
    let foundKey: any = null;
    let foundUserId: string | null = null;
    let foundKeyId: string | null = null;

    for (const docSnap of snapshot.docs) {
      const settings = docSnap.data();
      const apiKeys = settings.apiKeys || [];
      
      const key = apiKeys.find((k: any) => k.key === apiKey);
      if (key) {
        foundKey = key;
        foundUserId = docSnap.id;
        foundKeyId = key.id;
        break;
      }
    }

    if (!foundKey || !foundUserId) {
      return { valid: false, error: 'API key not found' };
    }

    // Check if key is enabled
    if (!foundKey.enabled) {
      return { valid: false, error: 'API key is disabled' };
    }

    // Update last used timestamp
    try {
      const settingsDoc = doc(db, 'settings', foundUserId);
      const settingsSnap = await getDoc(settingsDoc);
      
      if (settingsSnap.exists()) {
        const settings = settingsSnap.data();
        const apiKeys = (settings.apiKeys || []).map((k: any) => 
          k.id === foundKeyId ? { ...k, lastUsed: new Date() } : k
        );
        
        await updateDoc(settingsDoc, { apiKeys });
      }
    } catch (error) {
      console.error('Error updating lastUsed:', error);
    }

    return { valid: true, userId: foundUserId };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { valid: false, error: 'Failed to validate API key' };
  }
}

/**
 * Helper to send unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return Response.json(
    { error: message },
    { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="AiSign API"' } }
  );
}
