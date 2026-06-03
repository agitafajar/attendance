import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      name: 'Alih Daya Attendance API',
      status: 'ok',
    };
  }
}
