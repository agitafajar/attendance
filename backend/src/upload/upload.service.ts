import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  async upload(file: Express.Multer.File, type: string) {
    if (this.configService.get<string>('UPLOAD_STORAGE') === 'cloudinary') {
      return this.uploadToCloudinary(file, type);
    }

    return this.uploadToLocalDisk(file, type);
  }

  private async uploadToCloudinary(file: Express.Multer.File, type: string) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });

    const folder = this.cloudinaryFolder(type);
    const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
    const publicId =
      resourceType === 'raw'
        ? `${randomUUID()}${extname(file.originalname).toLowerCase()}`
        : randomUUID();

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: resourceType,
          use_filename: false,
          unique_filename: false,
          overwrite: false,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }

          resolve(uploadResult);
        },
      );

      uploadStream.end(file.buffer);
    }).catch((error: unknown) => {
      if (error instanceof Error) {
        console.error(`Cloudinary upload failed: ${error.message}`);
      }

      throw new ServiceUnavailableException({
        message: 'Upload provider is unavailable',
      });
    });

    return {
      originalName: file.originalname,
      filename: result.public_id,
      mimetype: file.mimetype,
      size: file.size,
      path: result.public_id,
      url: result.secure_url,
      absoluteUrl: result.secure_url,
      storage: 'cloudinary',
      providerPublicId: result.public_id,
    };
  }

  private async uploadToLocalDisk(file: Express.Multer.File, type: string) {
    const appUrl =
      this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
    const extension = extname(file.originalname).toLowerCase();
    const filename = `${randomUUID()}${extension}`;
    const uploadDir =
      this.configService.get<string>('UPLOAD_DIR') ?? './uploads';
    const destination = join(uploadDir, type);
    const path = join(destination, filename);
    const relativeUrl = `/uploads/${type}/${filename}`;

    await mkdir(destination, { recursive: true });
    await writeFile(path, file.buffer);

    return {
      originalName: file.originalname,
      filename,
      mimetype: file.mimetype,
      size: file.size,
      path,
      url: relativeUrl,
      absoluteUrl: `${appUrl}${relativeUrl}`,
      storage: 'local',
    };
  }

  private cloudinaryFolder(type: string) {
    const rootFolder =
      this.configService.get<string>('CLOUDINARY_FOLDER') ??
      'alih-daya-attendance';
    return `${rootFolder}/${type}`;
  }
}
