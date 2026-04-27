import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth() {
    return {
      message: 'Backend API connected',
      timestamp: new Date().toISOString(),
    };
  }
}
