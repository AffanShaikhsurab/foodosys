# DeepSeek OCR on Modal.com

Deploy and run DeepSeek OCR on Modal's serverless GPU infrastructure for powerful document OCR with automatic scaling.

## Features

- 🚀 **Serverless GPU**: Auto-scaling OCR with A100 GPU
- 📄 **High Quality**: Extract text and convert documents to markdown
- ⚡ **Fast Cold Starts**: Model cached in Modal volumes
- 🔧 **Flexible Modes**: Choose quality vs. speed (Tiny, Small, Base, Large, Gundam)
- 🌐 **Web API**: RESTful endpoint for easy integration

## Prerequisites

1. Install Modal:
```bash
pip install modal
```

2. Set up Modal authentication:
```bash
modal setup
```

## Deployment

### 1. Download the Model (First Time)

This caches the model to speed up subsequent runs:

```bash
modal run deepseek_ocr.py::download_model
```

### 2. Deploy the App

```bash
modal deploy deepseek_ocr.py
```

This creates a persistent web endpoint. Modal will output the URL, which looks like:
```
https://yourname--deepseek-ocr-ocr-endpoint.modal.run
```

## Usage

### Test with Sample Image

Test the deployment with a URL:

```bash
modal run deepseek_ocr.py::test_url
```

Test with a local file:

```bash
modal run deepseek_ocr.py::test_local --image-path /path/to/your/menu.jpg
```

### Using the Web API

#### cURL Example

```bash
curl -X POST https://yourname--deepseek-ocr-ocr-endpoint.modal.run \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/menu-image.jpg",
    "mode": "base"
  }'
```

#### JavaScript/TypeScript Example

```javascript
const response = await fetch('https://yourname--deepseek-ocr-ocr-endpoint.modal.run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image_url: 'https://example.com/menu-image.jpg',
    mode: 'base',
    prompt: '<image>\n<|grounding|>Convert the document to markdown. '
  }),
});

const result = await response.json();
console.log('OCR Result:', result.text);
```

#### Python Example

```python
import requests

response = requests.post(
    'https://yourname--deepseek-ocr-ocr-endpoint.modal.run',
    json={
        'image_url': 'https://example.com/menu-image.jpg',
        'mode': 'base',
    }
)

result = response.json()
print('OCR Result:', result['text'])
```

### API Request Format

**Endpoint**: POST to your Modal web endpoint

**Body** (JSON):
```json
{
  "image_url": "https://example.com/image.jpg",  // Option 1: Image URL
  "image_base64": "base64_encoded_image",        // Option 2: Base64 encoded image
  "prompt": "<image>\n<|grounding|>Convert the document to markdown. ",  // Optional
  "mode": "base",                                // Optional: tiny, small, base, large, gundam
  "test_compress": false                         // Optional: test compression
}
```

**Response**:
```json
{
  "text": "# Menu\n\n## Appetizers\n- Spring Rolls...",
  "mode": "base",
  "config": {
    "base_size": 1024,
    "image_size": 1024,
    "crop_mode": false
  }
}
```

## OCR Modes

Choose the mode based on your quality vs. speed requirements:

| Mode   | Base Size | Image Size | Crop Mode | Use Case |
|--------|-----------|------------|-----------|----------|
| `tiny` | 512 | 512 | False | Very fast, simple documents |
| `small` | 640 | 640 | False | Balanced for simple documents |
| **`base`** | **1024** | **1024** | **False** | **Recommended: Good quality for most use cases** |
| `large` | 1280 | 1280 | False | Highest quality, complex documents |
| `gundam` | 1024 | 640 | True | High quality with cropping optimization |

## Prompts

### Free OCR (Text Extraction Only)
```
"<image>\nFree OCR. "
```

### Grounded OCR with Markdown Conversion (Default)
```
"<image>\n<|grounding|>Convert the document to markdown. "
```

## Cost Optimization

Modal charges per second of GPU usage:

- **Container Idle Timeout**: Containers stay warm for 2 minutes after last use to avoid cold starts
- **GPU**: A100 (40GB) provides excellent performance for OCR tasks
- **Cold Starts**: ~10-20 seconds (model is cached in volume)
- **Inference Time**: ~2-5 seconds per image (depends on mode and image size)

**Tips**:
- Use `base` mode for best quality/cost balance
- Batch multiple images if possible
- Container stays warm between requests for 2 minutes

## Integration with Your App

### For Menu OCR in Foodosys

You can integrate this into your menu upload flow:

```typescript
// In your menu upload handler
async function processMenuImage(imageUrl: string) {
  const response = await fetch(process.env.MODAL_OCR_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      mode: 'base',
      prompt: '<image>\n<|grounding|>Convert the document to markdown. '
    }),
  });
  
  const result = await response.json();
  
  // Extract menu items from markdown
  return parseMenuFromMarkdown(result.text);
}
```

Add to your `.env.local`:
```
MODAL_OCR_ENDPOINT=https://yourname--deepseek-ocr-ocr-endpoint.modal.run
```

## Monitoring

Check your Modal dashboard for:
- Usage metrics
- Cost tracking
- Error logs
- Performance metrics

Visit: https://modal.com/apps

## Troubleshooting

### Cold Starts Taking Too Long?
Run `modal run deepseek_ocr.py::download_model` to ensure the model is cached.

### Out of Memory Errors?
Try using a smaller mode (`small` or `tiny`) or ensure you're using A100 GPU.

### Image Not Loading?
- Verify the image URL is publicly accessible
- Check image format (JPEG, PNG supported)
- Try using base64 encoding instead

## Support

- Modal Docs: https://modal.com/docs
- DeepSeek OCR: https://huggingface.co/deepseek-ai/DeepSeek-OCR
