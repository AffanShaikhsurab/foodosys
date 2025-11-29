const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Create a simple test image file
const testImagePath = './test-image.png'
const pngData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
  0x54, 0x08, 0x99, 0x63, 0xF8, 0x0F, 0x00, 0x00,
  0x01, 0x01, 0x00, 0x00, 0x18, 0xDD, 0x8D, 0xB4,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
  0xAE, 0x42, 0x60, 0x82
])

fs.writeFileSync(testImagePath, pngData)
console.log('Test image created:', testImagePath)

const supabase = createClient('https://gzyhcqdgslztzhwqjceh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWhjcWRnc2x6dHpod3FqY2VoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQwOTY0NCwiZXhwIjoyMDc5OTg1NjQ0fQ.JgegF8H-jx9DtiokVXNaEzc_iyHcOOrnLJIa2ULwuyQ')

async function test() {
  console.log('\n=== DIRECT UPLOAD TEST ===\n')
  
  // Test 1: Upload with upsert: false
  console.log('Test 1: upsert=false')
  const testPath1 = 'menus/magna/test-' + Date.now() + '.png'
  const { data: data1, error: error1 } = await supabase.storage
    .from('menu-images')
    .upload(testPath1, pngData, { contentType: 'image/png', upsert: false })
  
  console.log('Result:', { hasError: !!error1, hasData: !!data1, path: data1?.path })
  if (error1) console.error('Error:', error1.message)
  
  // Test 2: List files
  console.log('\nListing storage after upload:')
  const { data: files } = await supabase.storage.from('menu-images').list('menus/magna')
  console.log('Files found:', files?.length)
  if (files && files.length > 0) {
    files.forEach(f => console.log(`  - ${f.name}`))
  }
}

test().catch(console.error)
