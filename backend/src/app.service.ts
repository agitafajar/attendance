import { Injectable } from '@nestjs/common';

import packageJson from '../package.json';

@Injectable()
export class AppService {
  getHealth() {
    const checkedAt = new Date().toISOString();

    return {
      name: 'Alih Daya Attendance API',
      status: 'ok',
      version: packageJson.version,
      environment: process.env.NODE_ENV ?? 'development',
      checkedAt,
    };
  }
}
