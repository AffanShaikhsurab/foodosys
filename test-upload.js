// Simple test to upload an image and see what happens
const form = new FormData()

// Create a simple test image (1x1 pixel PNG)
const pngData = new Uint8Array([
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

const blob = new Blob([pngData], { type: 'image/png' })
const file = new File([blob], 'test-menu.png', { type: 'image/png' })

form.append('file', file)
form.append('restaurantSlug', 'magna')

// Get auth token
const token = localStorage.getItem('sb-' + 'gzyhcqdgslztzhwqjceh' + '-auth-token')
const tokenData = token ? JSON.parse(token) : null
const authToken = tokenData?.session?.access_token || null

console.log('Auth token available:', !!authToken)
console.log('Form data ready:', !!form)

// Upload
fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': authToken ? `Bearer ${authToken}` : '',
  },
  body: form
})
.then(r => r.json())
.then(data => {
  console.log('Upload response:', data)
  alert('Upload result: ' + (data.success ? 'SUCCESS' : 'FAILED'))
})
.catch(err => {
  console.error('Upload error:', err)
  alert('Upload error: ' + err.message)
})
