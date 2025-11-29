const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function testMenuUpload() {
  try {
    console.log('Testing menu upload and analysis with Gemini Flash model...')
    
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured in .env.local')
      process.exit(1)
    }
    
    // Test with a sample image (you'll need to replace this with an actual menu image)
    const testImagePath = path.join(__dirname, '../test-menu.jpg')
    
    if (!fs.existsSync(testImagePath)) {
      console.error(`Test image not found at ${testImagePath}`)
      console.log('Please add a menu image at test-menu.jpg to test the menu upload')
      process.exit(1)
    }
    
    // Read image and create form data
    const imageBuffer = fs.readFileSync(testImagePath)
    const formData = new FormData()
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
    
    formData.append('file', blob, 'test-menu.jpg')
    formData.append('restaurantId', 'f9c2f1a0-1234-5678-9abc-123456789012') // Example UUID
    formData.append('restaurantName', 'Test Restaurant')
    
    console.log('Uploading menu image for analysis...')
    
    // Call the upload API endpoint
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    
    console.log('Menu upload and analysis successful!')
    console.log('API Response:')
    console.log(JSON.stringify(result, null, 2))
    
    if (result.menu && result.menu.content) {
      console.log(`\nFound ${result.menu.content.sections.length} sections:`)
      result.menu.content.sections.forEach((section, index) => {
        console.log(`  ${index + 1}. ${section.name} (${section.items.length} items)`)
        section.items.forEach((item, itemIndex) => {
          console.log(`     ${itemIndex + 1}. ${item.name} - ${item.price}`)
        })
      })
    }
    
    console.log('\nMenu upload test completed successfully!')
  } catch (error) {
    console.error('Menu upload test failed:', error)
    process.exit(1)
  }
}

// Check if the development server is running
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health')
    return response.ok
  } catch {
    return false
  }
}

async function main() {
  const serverRunning = await checkDevServer()
  if (!serverRunning) {
    console.error('Development server is not running. Please start it with "npm run dev"')
    process.exit(1)
  }
  
  await testMenuUpload()
}

main()