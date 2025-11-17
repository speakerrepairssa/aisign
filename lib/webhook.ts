/**
 * Webhook Service
 * Handles sending webhook notifications for document events
 */

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: WebhookEvent[];
  enabled: boolean;
}

export type WebhookEvent =
  | 'form.viewed'
  | 'form.started'
  | 'form.completed'
  | 'form.declined'
  | 'submission.created'
  | 'submission.completed'
  | 'submission.expired'
  | 'submission.archived'
  | 'template.created'
  | 'template.updated';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

/**
 * Send webhook notification
 */
export async function sendWebhook(
  config: WebhookConfig,
  event: WebhookEvent,
  data: any
): Promise<{ success: boolean; error?: string }> {
  if (!config.enabled) {
    console.log('Webhook disabled, skipping');
    return { success: true };
  }

  if (!config.events.includes(event)) {
    console.log(`Event ${event} not subscribed, skipping`);
    return { success: true };
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'AiSign-Webhook/1.0',
  };

  // Add signature if secret is provided
  if (config.secret) {
    const signature = await generateSignature(JSON.stringify(payload), config.secret);
    headers['X-AiSign-Signature'] = signature;
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    console.log(`Webhook sent successfully for event: ${event}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Webhook error for event ${event}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Generate HMAC signature for webhook payload
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return `sha256=${hashHex}`;
}

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await generateSignature(payload, secret);
  return signature === expectedSignature;
}

/**
 * Send form.viewed webhook
 */
export async function sendFormViewedWebhook(
  config: WebhookConfig,
  submissionId: string,
  formName: string,
  recipientEmail?: string
) {
  return sendWebhook(config, 'form.viewed', {
    submission_id: submissionId,
    form_name: formName,
    recipient_email: recipientEmail,
  });
}

/**
 * Send form.started webhook
 */
export async function sendFormStartedWebhook(
  config: WebhookConfig,
  submissionId: string,
  formName: string,
  recipientEmail?: string
) {
  return sendWebhook(config, 'form.started', {
    submission_id: submissionId,
    form_name: formName,
    recipient_email: recipientEmail,
  });
}

/**
 * Send form.completed webhook
 */
export async function sendFormCompletedWebhook(
  config: WebhookConfig,
  submissionId: string,
  formName: string,
  recipientEmail: string,
  values: Record<string, any>
) {
  return sendWebhook(config, 'form.completed', {
    submission_id: submissionId,
    form_name: formName,
    recipient_email: recipientEmail,
    values,
  });
}

/**
 * Send submission.created webhook
 */
export async function sendSubmissionCreatedWebhook(
  config: WebhookConfig,
  submissionId: string,
  templateId: string,
  templateName: string,
  recipientEmail: string
) {
  return sendWebhook(config, 'submission.created', {
    submission_id: submissionId,
    template_id: templateId,
    template_name: templateName,
    recipient_email: recipientEmail,
  });
}

/**
 * Send submission.completed webhook
 */
export async function sendSubmissionCompletedWebhook(
  config: WebhookConfig,
  submissionId: string,
  templateId: string,
  templateName: string,
  recipientEmail: string,
  completedAt: Date
) {
  return sendWebhook(config, 'submission.completed', {
    submission_id: submissionId,
    template_id: templateId,
    template_name: templateName,
    recipient_email: recipientEmail,
    completed_at: completedAt.toISOString(),
  });
}
