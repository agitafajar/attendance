import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UploadQueryDto } from './dto/upload-query.dto';
import { UploadService } from './upload.service';

const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedDocumentMimeTypes = ['application/pdf'];

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = [
          ...allowedImageMimeTypes,
          ...allowedDocumentMimeTypes,
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Only jpeg, png, webp, and pdf files are allowed',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: Number(process.env.UPLOAD_MAX_SIZE_MB ?? 5) * 1024 * 1024,
      },
    }),
  )
  async upload(
    @CurrentUser() _user: JwtUser,
    @UploadedFile() file: Express.Multer.File,
    @Query() query: UploadQueryDto,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const type = UploadController.sanitizeType(query.type ?? 'general');
    return this.uploadService.upload(file, type);
  }

  private static sanitizeType(type: string) {
    if (!['attendance', 'activity', 'leave', 'general'].includes(type)) {
      return 'general';
    }

    return type;
  }
}
