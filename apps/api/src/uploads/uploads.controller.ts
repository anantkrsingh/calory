import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  uploadedImageSchema,
  uploadSignatureRequestSchema,
  uploadSignatureSchema,
  type UploadSignatureRequest,
} from '@fitness/validation';

import { Roles } from '../auth/roles.guard';
import { ApiZodResponse } from '../common/swagger';
import { zodPipe } from '../common/zod-validation.pipe';
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  UploadsService,
  type UploadedImageResult,
  type UploadSignatureResult,
} from './uploads.service';

@ApiTags('uploads')
@ApiBearerAuth('access-token')
@Roles('admin')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('image')
  @ApiOperation({
    summary:
      'Upload an image to Cloudinary (admin only). JPEG/PNG are converted to WebP. Max 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiZodResponse(uploadedImageSchema, {
    description: 'Uploaded image metadata',
    name: 'UploadedImage',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Unsupported image type. Use JPEG, PNG, WebP, or GIF.',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadedImageResult> {
    return this.uploads.uploadImage(file);
  }

  @Post('signature')
  @ApiOperation({
    summary:
      'Sign upload params (admin only) so the client can POST an image straight to Cloudinary, bypassing this server.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        folder: { type: 'string' },
      },
    },
  })
  @ApiZodResponse(uploadSignatureSchema, {
    description: 'Signed Cloudinary upload params',
    name: 'UploadSignature',
  })
  createSignature(
    @Body(zodPipe(uploadSignatureRequestSchema)) body: UploadSignatureRequest,
  ): UploadSignatureResult {
    return this.uploads.createSignature(body.folder);
  }
}
