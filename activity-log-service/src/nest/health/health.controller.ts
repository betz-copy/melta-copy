import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiskHealthIndicator, HealthCheck, HealthCheckService, MemoryHealthIndicator, MongooseHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import config from '../../config';

const {
    memory: { heapLimit, rssLimit },
} = config;

@ApiTags('Health')
@Controller('health')
@SkipThrottle()
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly memory: MemoryHealthIndicator,
        private readonly disk: DiskHealthIndicator,
        private readonly mongoose: MongooseHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Check application health status' })
    check() {
        return this.health.check([
            () => this.mongoose.pingCheck('mongodb'),

            () => this.memory.checkHeap('memory_heap', heapLimit),

            () => this.memory.checkRSS('memory_rss', rssLimit),

            () =>
                this.disk.checkStorage('disk', {
                    path: '/',
                    thresholdPercent: 0.9,
                }),
        ]);
    }

    @Get('liveness')
    @ApiOperation({ summary: 'Kubernetes liveness probe - simple alive check' })
    liveness() {
        return { status: 'ok' };
    }

    @Get('readiness')
    @HealthCheck()
    @ApiOperation({ summary: 'Kubernetes readiness probe - checks if service is ready to accept traffic' })
    readiness() {
        return this.health.check([() => this.mongoose.pingCheck('mongodb')]);
    }
}
