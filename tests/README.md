# Modal OCR Tests

Complete test suite for verifying Modal.com DeepSeek OCR endpoint functionality.

## 🚀 Quick Start

```bash
# 1. Run diagnostic test
node tests/diagnose-modal-ocr.js

# 2. If diagnostic passes, run full test
node tests/test-modal-ocr.js

# 3. (Optional) Run comprehensive test
npx tsx tests/test-modal-ocr.ts --comprehensive
```

## 📁 Files

- **`test-modal-ocr.js`** ⭐ - Main test (Node.js, no dependencies)
- **`test-modal-ocr.ts`** - Advanced TypeScript test suite
- **`diagnose-modal-ocr.js`** - Diagnostic & connectivity tool
- **`INDEX.md`** - Complete navigation guide
- **`README-OCR-TESTS.md`** - Detailed documentation
- **`MODAL_OCR_DEBUG.md`** - Troubleshooting guide
- **`QUICK_TEST_COMMANDS.md`** - Command examples

## ⚠️ Current Status

**Modal endpoint is returning 500 Internal Server Error**

This is a Modal deployment issue. The tests are working correctly but the Modal function needs debugging.

### Next Steps:
1. Read `MODAL_OCR_DEBUG.md` for troubleshooting
2. Check Modal dashboard: https://modal.com/apps
3. Try: `modal deploy deepseek_ocr.py --force-build`

## 📖 Documentation

Start with **`INDEX.md`** for complete navigation and guidance.

## Test Image

Default: `C:\Users\affan\Downloads\36bcd1c5-42b3-4aea-9fc2-4b051e98ab50.jpeg`

## Endpoint

Default: `https://magadumpramod420--deepseek-ocr-ocr-endpoint.modal.run/`
