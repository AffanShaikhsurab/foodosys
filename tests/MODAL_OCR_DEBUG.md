# Modal OCR Debugging Guide

## Current Issue: 500 Internal Server Error

The Modal OCR endpoint is returning `500 Internal Server Error` when called. This indicates an issue with the deployed Modal function, not with the test or network connectivity.

## Quick Diagnostic Results

✅ **Working:**
- Endpoint URL is correctly formatted
- Network connectivity is fine
- Test image file exists
- Request is reaching the Modal endpoint

❌ **Issue:**
- Modal function returns 500 error
- Error occurs even with minimal test image
- Function call ID: `fc-01KBFG3DRAFDC7BJ5M5YTC1KVN`

## Next Steps to Debug

### 1. Check Modal Logs

View the logs for the specific failed request:

```bash
# Login to Modal first (if not already logged in)
modal token set --token-id <your-token-id> --token-secret <your-token-secret>

# View recent logs
modal logs deepseek-ocr

# Or view specific function logs
modal logs deepseek-ocr::process_ocr
```

### 2. Verify Modal Function Deployment

Check if the function is properly deployed:

```bash
# List all deployed functions
modal app list

# Check the specific app status
modal app lookup deepseek-ocr
```

### 3. Test Modal Function Locally

Try running the Modal function locally to see detailed errors:

```bash
# Test with the built-in test function
modal run deepseek_ocr.py::test_local --image-path "C:\Users\affan\Downloads\36bcd1c5-42b3-4aea-9fc2-4b051e98ab50.jpeg"
```

### 4. Common Issues and Solutions

#### Issue: Model Not Downloaded
**Symptoms:** 500 error on first call, or timeout
**Solution:**
```bash
# Run the model download function
modal run deepseek_ocr.py::download_model
```

#### Issue: GPU Not Available
**Symptoms:** Timeout or 500 error
**Solution:**
- Check Modal GPU quota/credits
- Try changing GPU type in `deepseek_ocr.py`:
  ```python
  @app.function(
      gpu="A10G",  # Try A10G instead of A100
      ...
  )
  ```

#### Issue: Flash Attention Compilation Failed
**Symptoms:** Import errors in logs
**Solution:** The image build might have failed. Try:
```bash
# Redeploy with fresh build
modal deploy deepseek_ocr.py --force-build
```

#### Issue: CUDA/GPU Memory Error
**Symptoms:** Out of memory errors in logs
**Solution:**
- Use smaller mode: `"tiny"` or `"small"`
- Reduce base_size in config
- Use A100 GPU (80GB) instead of A10G (24GB)

#### Issue: Timeout on Cold Start
**Symptoms:** First request times out
**Solution:**
- Increase `timeout` parameter in function decorator
- Keep containers warm with `scaledown_window`
- Pre-download model with `download_model` function

### 5. Redeploy the Function

If issues persist, try a fresh deployment:

```bash
# Redeploy the Modal function
modal deploy deepseek_ocr.py

# Force rebuild of the image
modal deploy deepseek_ocr.py --force-build
```

### 6. Check Modal Dashboard

Visit the Modal dashboard to see detailed information:
1. Go to https://modal.com/apps
2. Find the `deepseek-ocr` app
3. Click on it to see deployment status, logs, and metrics
4. Check for any error messages or warnings

## Understanding the Error

The `modal-function-call-id: fc-01KBFG3DRAFDC7BJ5M5YTC1KVN` in the response headers can be used to find the exact logs for this failed request in the Modal dashboard or CLI.

## Testing Workflow

Once you've identified and fixed the issue:

1. **Verify fix:**
   ```bash
   node tests/diagnose-modal-ocr.js
   ```

2. **Run quick test:**
   ```bash
   node tests/test-modal-ocr.js
   ```

3. **Run comprehensive test:**
   ```bash
   npx tsx tests/test-modal-ocr.ts --comprehensive
   ```

## Get Modal Support

If the issue persists:

1. Join Modal Slack: https://modal.com/slack
2. Check Modal Discord: https://modal.com/discord
3. Post in Modal community forums
4. Include:
   - The function call ID from error
   - Relevant logs
   - Your deployment command
   - Python version and dependencies

## Expected Working Configuration

Once working, you should see:

```
✓ Test 3: Endpoint Connectivity with Minimal Payload
  Response Status: 200 OK
  Response Time: ~3000ms (first call may be slower)
  ✅ Endpoint is reachable and responding

✓ Test 4: Response Format
  ✅ Response is valid JSON
  ✅ Has "text" field
  ✅ Has "mode" field
  ✅ Has "config" field

🎉 All diagnostic tests passed!
```

## Modal Configuration Requirements

Ensure your `deepseek_ocr.py` has:

- ✅ Correct CUDA installation (12.4)
- ✅ Flash-attention properly compiled
- ✅ Model volume configured
- ✅ GPU type specified (A100 or A10G)
- ✅ Sufficient timeout (600s+)
- ✅ FastAPI endpoint properly configured

## Contact

If you need help debugging:
1. Share the Modal logs
2. Share any error messages
3. Confirm GPU availability in your Modal account
