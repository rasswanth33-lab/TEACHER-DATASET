import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getSystemHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'DSU Faculty Research Intelligence System API',
      version: '1.0.0',
      modules: {
        facultyManagement: 'READY',
        researchEngine: 'READY',
        accreditationMapping: 'READY',
        deduplicationEngine: 'READY',
      },
    };
  }
}
