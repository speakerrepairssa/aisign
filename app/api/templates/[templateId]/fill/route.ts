import { NextRequest, NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { fillPDFTemplate } from '@/lib/pdfFiller';

/**
 * API endpoint to fill a document template
 * POST /api/templates/[templateId]/fill
 * 
 * Usage with external tools:
 * - n8n: HTTP Request node
 * - Make.com: HTTP module
 * - Pabbly: Webhook/API action
 * - WordPress: wp_remote_post()
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const { templateId } = params;

    // Get API key from header
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required. Add x-api-key header.' },
        { status: 401 }
      );
    }

    // Get the template
    const templateRef = doc(db, 'templates', templateId);
    const templateSnap = await getDoc(templateRef);

    if (!templateSnap.exists()) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const template = templateSnap.data();

    // Verify API key
    if (template.apiKey !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 403 }
      );
    }

    // Get the data to fill
    const body = await request.json();
    const { data, metadata } = body;

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid data format. Expected { data: { key: value } }' },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = template.placeholders.filter((p: any) => p.required);
    const missingFields = requiredFields
      .filter((p: any) => !data[p.key])
      .map((p: any) => p.key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Download the template PDF
    const templatePdfResponse = await fetch(template.fileUrl);
    const templatePdfBytes = await templatePdfResponse.arrayBuffer();

    // Fill the PDF
    const filledPdfBytes = await fillPDFTemplate(
      templatePdfBytes,
      template.placeholders,
      data,
      { autoSize: true, maxFontSize: 12, minFontSize: 6 }
    );

    // Upload the filled PDF
    const fileName = `${template.title}-${Date.now()}.pdf`;
    const filePath = `filled-documents/${template.ownerId}/${fileName}`;
    const storageRef = ref(storage, filePath);
    
    await uploadBytes(storageRef, filledPdfBytes, {
      contentType: 'application/pdf',
    });

    const fileUrl = await getDownloadURL(storageRef);

    // Save record to Firestore
    const filledDocRef = await addDoc(collection(db, 'filled-documents'), {
      templateId,
      templateTitle: template.title,
      title: fileName,
      filledData: data,
      fileUrl,
      filePath,
      ownerId: template.ownerId,
      source: metadata?.source || 'api',
      sourceDetails: metadata || {},
      createdAt: serverTimestamp(),
    });

    // Trigger webhook if configured
    if (template.webhookUrl) {
      try {
        await fetch(template.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: filledDocRef.id,
            templateId,
            fileUrl,
            data,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Webhook error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      documentId: filledDocRef.id,
      fileUrl,
      fileName,
      message: 'Document filled successfully',
    });
  } catch (error: any) {
    console.error('Fill template error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fill template' },
      { status: 500 }
    );
  }
}
