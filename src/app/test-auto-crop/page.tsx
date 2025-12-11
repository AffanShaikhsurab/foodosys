import TestAutoCropUpload from '@/components/test-auto-crop-upload'

export default function TestAutoCropPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Auto-Crop Test Page</h1>
        <p className="text-center mb-8 text-gray-600">
          Upload an image to test the auto-cropping functionality. The image will be automatically cropped to focus on the menu content.
        </p>
        <TestAutoCropUpload />
      </div>
    </div>
  )
}