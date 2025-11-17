import { NextRequest, NextResponse } from 'next/server';
import { sendWebhook, WebhookConfig } from '@/lib/webhook';

export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json();

    if (!config.url) {
      return NextResponse.json(
        { success: false, error: 'Webhook URL required' },
        { status: 400 }
      );
    }

    // Send test webhook
    const result = await sendWebhook(
      { ...config, enabled: true } as WebhookConfig,
      'form.completed',
      {
        test: true,
        message: 'This is a test webhook from AiSign',
        submission_id: 'test_' + Date.now(),
        form_name: 'Test Form',
        recipient_email: 'test@example.com',
        values: {
          field_1: 'Test Value 1',
          field_2: 'Test Value 2',
        },
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send test webhook' },
      { status: 500 }
    );
  }
}
