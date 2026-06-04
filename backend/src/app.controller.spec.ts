import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API health metadata', () => {
      const result = appController.getHealth();

      expect(result).toEqual({
        name: 'Alih Daya Attendance API',
        status: 'ok',
        version: '0.0.1',
        environment: process.env.NODE_ENV ?? 'development',
        checkedAt: expect.any(String),
      });
      expect(new Date(result.checkedAt).toISOString()).toBe(result.checkedAt);
    });
  });
});
