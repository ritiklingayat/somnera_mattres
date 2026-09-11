import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

class CloudinaryService {
  constructor() {
    this.configured = false;
    if (
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET &&
      env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name'
    ) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      this.configured = true;
    }
  }

  isConfigured() {
    return this.configured;
  }

  /**
   * Uploads buffer to Cloudinary via upload_stream
   * @param {Buffer} buffer
   * @param {Object} options
   * @returns {Promise<{ url: string, publicId: string, secure_url: string }>}
   */
  async uploadBuffer(buffer, options = {}) {
    const folder = options.folder || 'somnera/products';
    const resourceType = options.resource_type || 'auto';

    if (!this.isConfigured()) {
      logger.info('[CLOUDINARY SIMULATION] File upload processed via local base64 / mock');
      const ext = options.format || 'jpg';
      const base64Data = buffer.toString('base64');
      const mime = resourceType === 'video' ? 'video/mp4' : `image/${ext}`;
      // In dev simulation, if payload is small use data URL, or generate simulated mock Cloudinary URL
      const simulatedUrl = `https://res.cloudinary.com/somnera-demo/image/upload/v1/${folder}/mock_${Date.now()}.${ext}`;
      return {
        url: simulatedUrl,
        secure_url: simulatedUrl,
        public_id: `mock_${Date.now()}`,
        simulated: true,
      };
    }

    return new Promise((resolve, reject) => {
      const isVideo = resourceType === 'video';
      const uploaderMethod = isVideo && typeof cloudinary.uploader.upload_chunked_stream === 'function'
        ? cloudinary.uploader.upload_chunked_stream.bind(cloudinary.uploader)
        : cloudinary.uploader.upload_stream.bind(cloudinary.uploader);

      const streamOptions = {
        folder,
        resource_type: resourceType,
        ...(isVideo ? { chunk_size: 6000000 } : {}),
        ...options,
      };

      const uploadStream = uploaderMethod(
        streamOptions,
        (error, result) => {
          if (error) {
            logger.error('Cloudinary stream upload error:', error);
            return reject(error);
          }
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Upload multiple file buffers in parallel
   */
  async uploadMultiple(files = [], options = {}) {
    if (!files || files.length === 0) return [];
    return Promise.all(
      files.map((file) =>
        this.uploadBuffer(file.buffer, {
          ...options,
          resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        })
      )
    );
  }

  /**
   * Delete asset by public_id
   */
  async deleteResource(publicId, resourceType = 'image') {
    if (!this.isConfigured() || !publicId || publicId.startsWith('mock_')) {
      return { result: 'ok', simulated: true };
    }
    try {
      return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw error;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
