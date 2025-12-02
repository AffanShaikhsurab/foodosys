# Quick Modal OCR Test Commands

## Using PowerShell

### Test with a tiny image (fastest)
```powershell
$tinyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

$body = @{
    image_base64 = $tinyImage
    prompt = "<image>\n<|grounding|>Convert the document to markdown. "
    mode = "tiny"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/" -Method Post -Body $body -ContentType "application/json"
```

### Test with your actual image
```powershell
$imagePath = "C:\Users\affan\Downloads\36bcd1c5-42b3-4aea-9fc2-4b051e98ab50.jpeg"
$imageBytes = [System.IO.File]::ReadAllBytes($imagePath)
$base64Image = [System.Convert]::ToBase64String($imageBytes)

$body = @{
    image_base64 = $base64Image
    prompt = "<image>\n<|grounding|>Convert the document to markdown. "
    mode = "base"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Mode: $($response.mode)"
    Write-Host "Text length: $($response.text.Length) characters"
    Write-Host "`nExtracted Text:"
    Write-Host "─" * 80
    Write-Host $response.text
    Write-Host "─" * 80
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

## Using curl (if installed)

### Test with tiny image
```bash
curl -X POST "https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/" \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
    "prompt": "<image>\\n<|grounding|>Convert the document to markdown. ",
    "mode": "tiny"
  }'
```

## Using Node.js tests (Recommended)

### Quick diagnostic
```bash
node tests/diagnose-modal-ocr.js
```

### Full test with your image
```bash
node tests/test-modal-ocr.js
```

### Comprehensive test (all modes)
```bash
npx tsx tests/test-modal-ocr.ts --comprehensive
```

## Expected Response Format

When working correctly, the endpoint returns:

```json
{
  "text": "# Menu\n\nStarters\n- Spring Rolls $5.99\n...",
  "mode": "base",
  "config": {
    "base_size": 1024,
    "image_size": 1024,
    "crop_mode": false
  }
}
```

## Current Error

Currently returns:
```
HTTP 500: Internal Server Error
```

## Modal Function Status

Check deployment status:
```bash
# List apps
modal app list

# Check containers
modal container list

# Redeploy if needed
modal deploy deepseek_ocr.py --force-build
```

## Debug Steps

1. **Check if model is cached:**
   ```bash
   modal run deepseek_ocr.py::download_model
   ```

2. **Test locally:**
   ```bash
   modal run deepseek_ocr.py::test_local --image-path "C:\Users\affan\Downloads\36bcd1c5-42b3-4aea-9fc2-4b051e98ab50.jpeg"
   ```

3. **View Modal dashboard:**
   - Visit: https://modal.com/apps
   - Find: deepseek-ocr
   - Check: Logs and errors

4. **Redeploy:**
   ```bash
   modal deploy deepseek_ocr.py --force-build
   ```

## Quick Validation Script

Save this as `quick-test.ps1`:

```powershell
Write-Host "🚀 Quick Modal OCR Test" -ForegroundColor Cyan
Write-Host "=" * 80

$endpoint = "https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/"
$tinyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

Write-Host "Testing endpoint: $endpoint"

$body = @{
    image_base64 = $tinyImage
    prompt = "<image>\n<|grounding|>Convert the document to markdown. "
    mode = "tiny"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60
    Write-Host "✅ PASS - Endpoint is working!" -ForegroundColor Green
    Write-Host "Response: $($response.text.Substring(0, [Math]::Min(100, $response.text.Length)))..."
} catch {
    Write-Host "❌ FAIL - Endpoint error" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. modal deploy deepseek_ocr.py --force-build"
    Write-Host "2. Check https://modal.com/apps"
    Write-Host "3. Run: modal run deepseek_ocr.py::download_model"
}
```

Run with:
```bash
powershell -ExecutionPolicy Bypass -File quick-test.ps1
```
