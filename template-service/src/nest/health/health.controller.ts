import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: MongooseHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Health check' })
    @ApiResponse({ status: 200, description: 'Service is healthy' })
    check() {
        return this.health.check([() => this.db.pingCheck('mongodb')]);
    }
}
