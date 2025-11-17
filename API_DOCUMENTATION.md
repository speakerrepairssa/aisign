# 🚀 AiSign API Documentation

## Overview

AiSign provides a powerful REST API for filling PDF templates with dynamic data from external automation tools like n8n, Make.com, Pabbly Connect, Zapier, and WordPress.

## Base URL
```
https://your-domain.com/api
```

For local development:
```
http://localhost:3000/api
```

---

## Authentication

All API requests require an API key in the header:

```http
x-api-key: aisign_your_api_key_here
```

### Generate API Key

1. Log in to your AiSign dashboard
2. Go to Settings → API Keys
3. Click "Generate New Key"
4. Copy and store the key securely (it's only shown once)

---

## Endpoints

### 1. Fill Template

Fill a PDF template with provided data and generate a new document.

**Endpoint:**
```
POST /api/templates/{templateId}/fill
```

**Headers:**
```http
Content-Type: application/json
x-api-key: your_api_key
```

**Request Body:**
```json
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Corp",
    "date": "2025-11-17",
    "amount": "5000"
  },
  "metadata": {
    "source": "n8n",
    "workflow_id": "12345",
    "custom_field": "any value"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "documentId": "abc123xyz",
  "fileUrl": "https://storage.googleapis.com/...",
  "fileName": "document-1234567890.pdf",
  "message": "Document filled successfully"
}
```

**Response (Error):**
```json
{
  "error": "Missing required fields: name, email"
}
```

---

## Integration Examples

### 🔷 n8n Integration

1. Add **HTTP Request** node
2. Configure:
   - **Method:** POST
   - **URL:** `https://your-domain.com/api/templates/{templateId}/fill`
   - **Authentication:** None (use Header Auth)
   - **Headers:**
     ```json
     {
       "x-api-key": "your_api_key",
       "Content-Type": "application/json"
     }
     ```
   - **Body:**
     ```json
     {
       "data": {
         "name": "{{ $json.name }}",
         "email": "{{ $json.email }}"
       },
       "metadata": {
         "source": "n8n",
         "workflow_id": "{{ $workflow.id }}"
       }
     }
     ```

### 🟢 Make.com Integration

1. Add **HTTP** module
2. Configure:
   - **URL:** `https://your-domain.com/api/templates/{templateId}/fill`
   - **Method:** POST
   - **Headers:**
     - `x-api-key`: your_api_key
     - `Content-Type`: application/json
   - **Body:**
     ```json
     {
       "data": {
         "name": "{{1.name}}",
         "email": "{{1.email}}"
       },
       "metadata": {
         "source": "make",
         "scenario_id": "{{scenario.id}}"
       }
     }
     ```

### 🟣 Pabbly Connect Integration

1. Add **Webhook/API Request** action
2. Configure:
   - **Request Type:** POST
   - **URL:** `https://your-domain.com/api/templates/{templateId}/fill`
   - **Headers:**
     - Key: `x-api-key`, Value: your_api_key
     - Key: `Content-Type`, Value: application/json
   - **Data:**
     ```json
     {
       "data": {
         "name": "{name}",
         "email": "{email}"
       },
       "metadata": {
         "source": "pabbly"
       }
     }
     ```

### 🔵 WordPress Integration

Add to your theme's `functions.php` or custom plugin:

```php
<?php
function aisign_fill_template($template_id, $data) {
    $api_key = 'your_api_key';
    $url = 'https://your-domain.com/api/templates/' . $template_id . '/fill';
    
    $response = wp_remote_post($url, array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'x-api-key' => $api_key
        ),
        'body' => json_encode(array(
            'data' => $data,
            'metadata' => array(
                'source' => 'wordpress',
                'user_id' => get_current_user_id()
            )
        ))
    ));
    
    if (is_wp_error($response)) {
        return false;
    }
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    return $body;
}

// Usage:
$result = aisign_fill_template('template_id_here', array(
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'company' => 'Acme Corp'
));

if ($result['success']) {
    echo 'Document URL: ' . $result['fileUrl'];
}
?>
```

### ⚡ cURL Example

```bash
curl -X POST https://your-domain.com/api/templates/TEMPLATE_ID/fill \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Corp"
    },
    "metadata": {
      "source": "curl"
    }
  }'
```

---

## Field Types & Auto-Sizing

AiSign automatically adjusts font sizes to fit content naturally:

### Text Field
```json
{
  "key": "name",
  "label": "Full Name",
  "type": "text",
  "fontSize": 12  // Auto-adjusts if text is too long
}
```

### Number Field
```json
{
  "key": "amount",
  "label": "Amount",
  "type": "number",
  "align": "right"
}
```

### Email Field
```json
{
  "key": "email",
  "label": "Email Address",
  "type": "email"
}
```

### Date Field
```json
{
  "key": "date",
  "label": "Date",
  "type": "date"
}
```

---

## Auto-Sizing Algorithm

The PDF filler automatically:
1. ✅ Calculates optimal font size based on text length
2. ✅ Adjusts to fit within field width
3. ✅ Maintains minimum readability (6pt minimum)
4. ✅ Respects maximum size (12pt default)
5. ✅ Centers, left, or right-aligns text as configured

**Result:** Documents look professionally filled, never automated!

---

## Rate Limits

- **Free Tier:** 100 requests/day
- **Pro Tier:** 1,000 requests/day
- **Enterprise:** Unlimited

---

## Webhook Notifications

Configure webhooks to get notified when documents are filled:

1. Go to Template Settings
2. Add Webhook URL
3. Receive POST requests:

```json
{
  "documentId": "abc123",
  "templateId": "template123",
  "fileUrl": "https://...",
  "data": { ... },
  "timestamp": "2025-11-17T10:00:00Z"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid data format |
| 401 | Unauthorized - Missing API key |
| 403 | Forbidden - Invalid API key |
| 404 | Not Found - Template doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Server Error - Contact support |

---

## Best Practices

1. **Store API keys securely** - Never commit to version control
2. **Use environment variables** - Store keys in .env files
3. **Validate data before sending** - Reduces errors
4. **Handle errors gracefully** - Check response status
5. **Use webhooks for async workflows** - Don't poll for status
6. **Test with sample data first** - Verify field mappings

---

## Support

- 📧 Email: support@aisign.com
- 📚 Docs: https://docs.aisign.com
- 💬 Discord: https://discord.gg/aisign

---

## Changelog

### v1.0.0 (2025-11-17)
- Initial API release
- Template filling endpoint
- Auto-sizing algorithm
- n8n, Make.com, Pabbly integration support
