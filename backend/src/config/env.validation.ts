type Env = Record<string, string | undefined>;

const requiredKeys = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

export function validateEnv(config: Env) {
  const missingKeys = requiredKeys.filter((key) => !config[key]);

  if (missingKeys.length) {
    throw new Error(`Missing required env vars: ${missingKeys.join(', ')}`);
  }

  const port = Number(config.PORT ?? 3000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  const uploadMaxSizeMb = Number(config.UPLOAD_MAX_SIZE_MB ?? 5);

  if (!Number.isInteger(uploadMaxSizeMb) || uploadMaxSizeMb <= 0) {
    throw new Error('UPLOAD_MAX_SIZE_MB must be a positive integer');
  }

  const uploadStorage = config.UPLOAD_STORAGE ?? 'local';

  if (!['local', 'cloudinary'].includes(uploadStorage)) {
    throw new Error('UPLOAD_STORAGE must be either local or cloudinary');
  }

  if (uploadStorage === 'cloudinary') {
    const missingCloudinaryKeys = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ].filter((key) => !config[key]);

    if (missingCloudinaryKeys.length) {
      throw new Error(
        `Missing Cloudinary env vars for cloudinary upload storage: ${missingCloudinaryKeys.join(', ')}`,
      );
    }
  }

  return {
    ...config,
    PORT: String(port),
    UPLOAD_STORAGE: uploadStorage,
    UPLOAD_MAX_SIZE_MB: String(uploadMaxSizeMb),
    UPLOAD_DIR: config.UPLOAD_DIR ?? './uploads',
    CORS_ORIGIN: config.CORS_ORIGIN ?? '*',
    RATE_LIMIT_TTL: config.RATE_LIMIT_TTL ?? '60',
    RATE_LIMIT_LIMIT: config.RATE_LIMIT_LIMIT ?? '120',
    SWAGGER_ENABLED: config.SWAGGER_ENABLED ?? 'false',
    CLOUDINARY_CLOUD_NAME: config.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: config.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: config.CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER: config.CLOUDINARY_FOLDER ?? 'alih-daya-attendance',
  };
}
