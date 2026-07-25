/**
 * Compress an image file using the HTML5 Canvas API.
 * Safely falls back to the original file if not in a browser environment (e.g. during unit tests)
 * or if canvas rendering fails.
 */
export async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<File> {
  // JSDOM test environment check (JSDOM lacks real image loading, causing onload to hang)
  const isJSDOM =
    typeof window !== 'undefined' &&
    (window.name === 'jsdom' ||
      navigator.userAgent.includes('jsdom') ||
      navigator.userAgent.includes('Node.js'))

  // If not an image or not in a browser environment, return original file
  if (
    !file.type.startsWith('image/') ||
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    isJSDOM
  ) {
    return file
  }

  try {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Resize if width exceeds maxWidth
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(file)
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = () => resolve(file)
      }
      reader.onerror = () => resolve(file)
    })
  } catch (error) {
    console.error('Image compression failed, falling back to original:', error)
    return file
  }
}
export function getCompressedSizeRatio(originalSize: number, compressedSize: number): string {
  if (originalSize <= 0) return '0%'
  const saved = originalSize - compressedSize
  const percentage = Math.max(0, Math.round((saved / originalSize) * 100))
  return `${percentage}%`
}
