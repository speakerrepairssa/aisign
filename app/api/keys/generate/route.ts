import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

/**
 * Generate API key for user
 * POST /api/keys/generate
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, name } = await request.json();

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId and name are required' },
        { status: 400 }
      );
    }

    // Generate secure API key
    const apiKey = `aisign_${nanoid(32)}`;

    // Save to Firestore
    const keyRef = await addDoc(collection(db, 'api-keys'), {
      userId,
      key: apiKey,
      name,
      isActive: true,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      keyId: keyRef.id,
      apiKey,
      message: 'API key generated successfully. Store it securely!',
    });
  } catch (error: any) {
    console.error('Generate API key error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate API key' },
      { status: 500 }
    );
  }
}
