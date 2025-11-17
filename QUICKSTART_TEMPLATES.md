# 🎯 Quick Start: Creating Your First Template

## Step 1: Upload a Document ✅

You already uploaded: **rock TEMPLATE TPOA 1 (company).pdf**

This SARS tax form is perfect for creating a template!

---

## Step 2: Create Template with Placeholders

### From Dashboard:

1. Go to your dashboard: http://localhost:3000/dashboard
2. Find "rock TEMPLATE TPOA 1 (company)" in your documents
3. Click the **"Template"** button (purple)
4. This opens the Template Editor

### Or Direct Link:

Visit: http://localhost:3000/documents/YOUR_DOC_ID/edit

---

## Step 3: Add Placeholders

In the template editor, you'll see:

### Left Side: PDF Preview
- Your document displays with an overlay
- Click "Add Placeholder" to create fields

### Right Side: Field Editor
- Configure each placeholder:
  - **Key**: `client_name`, `id_number`, `tax_reference`
  - **Label**: Display name
  - **Type**: Text, Number, Email, Date
  - **Font Size**: Auto-adjusts if needed
  - **Required**: Yes/No

### Example Placeholders for SARS Form:

```javascript
[
  {
    "key": "taxpayer_name",
    "label": "Taxpayer Name",
    "type": "text",
    "required": true
  },
  {
    "key": "id_number",
    "label": "ID/Passport Number",
    "type": "text",
    "required": true
  },
  {
    "key": "representative_name",
    "label": "Representative Name",
    "type": "text",
    "required": true
  },
  {
    "key": "practitioner_name",
    "label": "Tax Practitioner Name",
    "type": "text",
    "required": false
  },
  {
    "key": "firm_number",
    "label": "Firm ID Number",
    "type": "text",
    "required": false
  }
]
```

---

## Step 4: Position Placeholders on PDF

**Current Version:** Placeholders show as overlays on the PDF

**Coming Next:** Drag-and-drop positioning

For now, manually set X, Y coordinates where text should appear.

---

## Step 5: Save Template

Click **"Save Template"** button - This:
- ✅ Saves placeholder configuration
- ✅ Marks document as a template
- ✅ Makes it available via API

---

## Step 6: Generate API Key

### In Dashboard:
1. Go to Settings → API Keys (coming soon)
2. Click "Generate New Key"
3. Copy: `aisign_xxxxxxxxxxxxxxxxxx`
4. Store securely

### Manual Generation (for now):
Use this endpoint:
```bash
curl -X POST http://localhost:3000/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "name": "n8n Integration"
  }'
```

---

## Step 7: Test the API

### Using cURL:

```bash
curl -X POST http://localhost:3000/api/templates/YOUR_TEMPLATE_ID/fill \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "data": {
      "taxpayer_name": "John Doe",
      "id_number": "8001015009087",
      "representative_name": "Jane Smith",
      "practitioner_name": "John Henry Robinson",
      "firm_number": "6505015123088"
    },
    "metadata": {
      "source": "test",
      "user": "admin"
    }
  }'
```

### Using n8n:

1. Create new workflow
2. Add **HTTP Request** node
3. Configure:
   - Method: POST
   - URL: `http://localhost:3000/api/templates/TEMPLATE_ID/fill`
   - Headers:
     ```json
     {
       "x-api-key": "your_key",
       "Content-Type": "application/json"
     }
     ```
   - Body:
     ```json
     {
       "data": {
         "taxpayer_name": "{{ $json.name }}",
         "id_number": "{{ $json.id }}"
       }
     }
     ```

---

## Step 8: Receive Filled Document

API Response:
```json
{
  "success": true,
  "documentId": "abc123",
  "fileUrl": "https://storage.googleapis.com/.../filled-document.pdf",
  "fileName": "rock-TEMPLATE-TPOA-1-1234567890.pdf",
  "message": "Document filled successfully"
}
```

Download the PDF from `fileUrl` - All fields will be perfectly filled!

---

## 📊 Use Cases for SARS Form:

### 1. **Tax Practitioner Software**
- Client submits info via web form
- n8n/Make workflow triggers
- SARS form auto-generated
- Client receives filled PDF via email

### 2. **WordPress + WooCommerce**
- Client purchases tax service
- Order data sent to AiSign API
- Form filled automatically
- Attached to order confirmation

### 3. **CRM Integration**
- New client added to CRM
- Webhook triggers AiSign API
- Tax form generated
- Stored in client folder

---

## 🎨 Auto-Sizing in Action

### Before:
```
Field width: 200px
Text: "Representative of Very Long Company Name Incorporated"
Font size: 12pt → Text overflows!
```

### After (Auto-Sized):
```
Field width: 200px
Text: "Representative of Very Long Company Name Incorporated"
Font size: 8pt (auto-calculated) → Fits perfectly!
```

**Result:** Professional, natural-looking documents every time!

---

## 🚀 Next Steps

1. **Click "Template" button** on your SARS document
2. **Add 5-10 placeholders** for common fields
3. **Save the template**
4. **Test with API** using sample data
5. **Integrate with n8n/Make/Pabbly**

---

## 💡 Pro Tips

- Use descriptive keys: `taxpayer_name` not `field1`
- Mark critical fields as required
- Start with larger font sizes (they'll shrink if needed)
- Test with longest possible text first
- Use webhooks for async processing

---

## 📚 Full Documentation

- **API Docs**: `API_DOCUMENTATION.md`
- **Setup Guide**: `SETUP.md`
- **Firebase Rules**: `FIREBASE_RULES.md`

---

Need help? The template editor is ready at:
**http://localhost:3000/documents/YOUR_DOC_ID/edit**

Just click the "Template" button in your dashboard! 🎉
