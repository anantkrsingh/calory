import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { Readable } from 'node:stream';

import { ENV, type Env } from '../config/env.module';

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** JPEG/PNG are re-encoded to WebP on upload; WebP/GIF are stored as-is. */
const CONVERT_TO_WEBP = new Set(['image/jpeg', 'image/jpg', 'image/png']);

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface UploadedImageResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface UploadSignatureResult {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

const DEFAULT_UPLOAD_FOLDER = 'fitness-tracker/exercises';

@Injectable()
export class UploadsService {
  private readonly configured: boolean;

  constructor(@Inject(ENV) private readonly env: Env) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      env;

    this.configured = Boolean(
      CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET,
    );

    if (this.configured) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  }

  /**
   * Signs upload params so the client can POST the file straight to
   * Cloudinary — the bytes never pass through this server. Only `folder` and
   * `timestamp` are signed; the client must send exactly these params back
   * (plus `file`, `api_key`, and `signature`) or Cloudinary will reject it.
   */
  createSignature(folder = DEFAULT_UPLOAD_FOLDER): UploadSignatureResult {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      this.env;

    if (!this.configured || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY) {
      throw new ServiceUnavailableException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      CLOUDINARY_API_SECRET as string,
    );

    return {
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
    };
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = DEFAULT_UPLOAD_FOLDER,
  ): Promise<UploadedImageResult> {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException('No image file provided');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported image type. Use JPEG, PNG, WebP, or GIF.',
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('Image must be 5MB or smaller');
    }

    const convertToWebp = CONVERT_TO_WEBP.has(file.mimetype);
    const result = await this.uploadBuffer(file.buffer, folder, convertToWebp);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  private uploadBuffer(
    buffer: Buffer,
    folder: string,
    convertToWebp: boolean,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          // Store JPEG/PNG as WebP for smaller delivery size.
          ...(convertToWebp ? { format: 'webp', quality: 'auto' } : {}),
        },
        (error, result) => {
          if (error || !result) {
            reject(new Error(error?.message ?? 'Cloudinary upload failed'));
            return;
          }
          resolve(result);
        },
      );

      Readable.from(buffer).pipe(stream);
    });
  }
}
