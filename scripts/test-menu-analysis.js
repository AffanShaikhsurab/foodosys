const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Since we can't directly import TypeScript, let's create a simple test
// that calls the API endpoint directly

async function testMenuAnalysis() {
  try {
    console.log('Testing menu analysis with Gemini Flash model...')
    
    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured in .env.local')
      process.exit(1)
    }
    
    // Test with a sample base64 image (you'll need to replace this with an actual menu image)
    const testImagePath = path.join(__dirname, '../test-image.png')
    
    if (!fs.existsSync(testImagePath)) {
      console.error(`Test image not found at ${testImagePath}`)
      console.log('Please add a menu image at test-image.png to test the menu analysis')
      process.exit(1)
    }
    
    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(testImagePath)
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`
    
    console.log('Analyzing menu from image...')
    const menuData = await menuAnalyzer.analyzeMenuFromImage(base64Image)
    
    console.log('Menu analysis successful!')
    console.log('Extracted menu structure:')
    console.log(JSON.stringify(menuData, null, 2))
    
    // Validate the structure
    if (!menuData.sections || !Array.isArray(menuData.sections)) {
      throw new Error('Invalid menu structure: sections array is required')
    }
    
    console.log(`\nFound ${menuData.sections.length} sections:`)
    menuData.sections.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section.name} (${section.items.length} items)`)
      section.items.forEach((item, itemIndex) => {
        console.log(`     ${itemIndex + 1}. ${item.name} - ${item.price}`)
      })
    })
    
    console.log('\nMenu analysis test completed successfully!')
  } catch (error) {
    console.error('Menu analysis test failed:', error)
    process.exit(1)
  }
}

testMenuAnalysis()