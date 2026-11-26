import { cloudinary, isCloudinaryConfigured } from '../../config/cloudinary'
import { ApiError } from '../../utils/ApiError'

export const uploadService = {
  async uploadBuffer(buffer: Buffer, folder = 'nookk-studio'): Promise<{ url: string; publicId: string }> {
    if (!isCloudinaryConfigured) {
      throw ApiError.internal(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      )
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error || !result) {
            reject(ApiError.internal(error?.message ?? 'Image upload failed'))
            return
          }
          resolve({ url: result.secure_url, publicId: result.public_id })
        },
      )
      stream.end(buffer)
    })
  },
}
