
/**
 * Utility functions for handling image orientation and processing
 */

// Get the orientation of an image file
// Returns a promise that resolves to the orientation number (1-8)
// 1 = Normal
// 3 = Rotated 180 degrees
// 6 = Rotated 90 degrees clockwise
// 8 = Rotated 90 degrees counter-clockwise
export async function getOrientation(file: File): Promise<number> {
    return new Promise((resolve) => {
        const reader = new FileReader()

        reader.onload = (event: ProgressEvent<FileReader>) => {
            if (!event.target?.result) {
                return resolve(1)
            }

            const view = new DataView(event.target.result as ArrayBuffer)

            if (view.getUint16(0, false) !== 0xFFD8) {
                return resolve(1) // Not a JPEG
            }

            const length = view.byteLength
            let offset = 2

            while (offset < length) {
                const marker = view.getUint16(offset, false)
                offset += 2

                if (marker === 0xFFE1) {
                    if (view.getUint32(offset + 2, false) !== 0x45786966) {
                        return resolve(1)
                    }

                    const little = view.getUint16(offset + 8, false) === 0x4949
                    offset += 8 + 2
                    const tags = view.getUint16(offset, little)
                    offset += 2

                    for (let i = 0; i < tags; i++) {
                        if (view.getUint16(offset + (i * 12), little) === 0x0112) {
                            return resolve(view.getUint16(offset + (i * 12) + 8, little))
                        }
                    }
                } else if ((marker & 0xFF00) !== 0xFF00) {
                    break
                } else {
                    offset += view.getUint16(offset, false)
                }
            }
            return resolve(1)
        }

        // Read the first 64kb of the file which should contain the EXIF tags
        reader.readAsArrayBuffer(file.slice(0, 64 * 1024))
    })
}

// Process an image file: read orientation, rotate if needed, and return base64
export async function processImage(file: File): Promise<string> {
    // 1. Get orientation
    const orientation = await getOrientation(file)

    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            const img = new Image()

            img.onload = () => {
                const width = img.width
                const height = img.height
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                if (!ctx) {
                    return reject(new Error('Could not get canvas context'))
                }

                // Set proper canvas dimensions before transform & export
                if (4 < orientation && orientation < 9) {
                    canvas.width = height
                    canvas.height = width
                } else {
                    canvas.width = width
                    canvas.height = height
                }

                // Transform context before drawing image
                switch (orientation) {
                    case 2: ctx.transform(-1, 0, 0, 1, width, 0); break
                    case 3: ctx.transform(-1, 0, 0, -1, width, height); break
                    case 4: ctx.transform(1, 0, 0, -1, 0, height); break
                    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break
                    case 6: ctx.transform(0, 1, -1, 0, height, 0); break
                    case 7: ctx.transform(0, -1, -1, 0, height, width); break
                    case 8: ctx.transform(0, -1, 1, 0, 0, width); break
                    default: break
                }

                // Draw image
                ctx.drawImage(img, 0, 0)

                // Export to base64
                // We use image/jpeg with 0.85 quality to keep file size reasonable
                resolve(canvas.toDataURL('image/jpeg', 0.85))
            }

            img.onerror = () => {
                reject(new Error('Failed to load image'))
            }

            img.src = e.target?.result as string
        }

        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }

        reader.readAsDataURL(file)
    })
}

// Helper to convert base64 to File object
export function base64ToFile(base64: string, filename: string = 'image.jpg'): File {
    const arr = base64.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }

    return new File([u8arr], filename, { type: mime })
}
