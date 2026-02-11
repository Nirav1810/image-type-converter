export type ImageFormat = 'jpeg' | 'png' | 'webp'

export interface ConversionOptions {
  format: ImageFormat
  quality?: number // 0-1, default 0.9 (only for JPEG/WEBP)
  width?: number // Optional: resize width
  height?: number // Optional: resize height
  scale?: number // Optional: resize scale (0-1)
}

export interface ConversionResult {
  blob: Blob
  filename: string
  size: number
}

/**
 * Validates if the file is a valid image
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  return validTypes.includes(file.type) && file.size > 0
}

/**
 * Converts an image file to the specified format
 */
export async function convertImage(
  file: File,
  options: ConversionOptions
): Promise<ConversionResult> {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!isValidImage(file)) {
      reject(new Error('Invalid image file'))
      return
    }

    // Read the file
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          throw new Error('Could not get canvas context')
        }

        img.onload = () => {
          // Calculate dimensions
          let width = img.naturalWidth
          let height = img.naturalHeight

          if (options.scale) {
            width = Math.round(img.naturalWidth * options.scale)
            height = Math.round(img.naturalHeight * options.scale)
          } else if (options.width && options.height) {
            width = options.width
            height = options.height
          } else if (options.width) {
            height = (img.naturalHeight / img.naturalWidth) * options.width
            width = options.width
          } else if (options.height) {
            width = (img.naturalWidth / img.naturalHeight) * options.height
            height = options.height
          }

          // Set canvas dimensions
          canvas.width = width
          canvas.height = height

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to blob
          const mimeType = `image/${options.format}`
          const quality = options.quality ?? (options.format === 'jpeg' ? 0.9 : 0.8)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                throw new Error('Blob conversion failed')
              }

              // Generate filename
              const originalName = file.name.split('.')[0]
              const newFilename = `${originalName}.${options.format}`

              resolve({
                blob,
                filename: newFilename,
                size: blob.size,
              })

              // Cleanup
              canvas.width = 0
              canvas.height = 0
            },
            mimeType,
            quality
          )
        }

        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }

        img.src = event.target?.result as string
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Batch convert multiple images
 */
export async function convertImageBatch(
  files: File[],
  options: ConversionOptions,
  onProgress?: (current: number, total: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    if (isValidImage(files[i])) {
      try {
        const result = await convertImage(files[i], options)
        results.push(result)
      } catch (error) {
        console.error(`Failed to convert ${files[i].name}:`, error)
      }
    }

    onProgress?.(i + 1, files.length)
  }

  return results
}

/**
 * Download a file from a blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
