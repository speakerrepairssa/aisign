import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Generate API Key
export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json();

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId and name are required' },
        { status: 400 }
      );
    }

    // Generate API key with prefix
    const apiKey = `aisign_${nanoid(32)}`;
    const keyId = nanoid();

    // Get existing settings
    const settingsRef = doc(db, 'settings', userId);
    const settingsSnap = await getDoc(settingsRef);
    const settings = settingsSnap.exists() ? settingsSnap.data() : {};

    // Add new API key to settings
    const apiKeys = settings.apiKeys || [];
    apiKeys.push({
      id: keyId,
      userId,
      name,
      key: apiKey,
      createdAt: new Date(),
      lastUsed: null,
      enabled: true,
    });

    // Update settings
    await setDoc(settingsRef, { ...settings, apiKeys }, { merge: true });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: keyId,
        name,
        key: apiKey,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate API key' },
      { status: 500 }
    );
  }
}

// Get all API keys for user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get settings document
    const settingsRef = doc(db, 'settings', userId);
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      return NextResponse.json({ success: true, keys: [] });
    }

    const settings = settingsSnap.data();
    const apiKeys = settings.apiKeys || [];
    
    const keys = apiKeys.map((key: any) => ({
      id: key.id,
      name: key.name,
      key: key.key.substring(0, 20) + '...' + key.key.substring(key.key.length - 4), // Mask key
      createdAt: key.createdAt?.toDate?.()?.toISOString() || key.createdAt,
      lastUsed: key.lastUsed?.toDate?.()?.toISOString() || key.lastUsed,
      enabled: key.enabled,
    }));

    return NextResponse.json({ success: true, keys });
  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// Delete API key
export async function DELETE(request: NextRequest) {
  try {
    const { keyId, userId } = await request.json();

    if (!keyId || !userId) {
      return NextResponse.json(
        { error: 'keyId and userId are required' },
        { status: 400 }
      );
    }

    // Get settings document
    const settingsRef = doc(db, 'settings', userId);
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      return NextResponse.json({ success: false, error: 'Settings not found' }, { status: 404 });
    }

    const settings = settingsSnap.data();
    const apiKeys = (settings.apiKeys || []).filter((key: any) => key.id !== keyId);

    // Update settings
    await setDoc(settingsRef, { ...settings, apiKeys }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
