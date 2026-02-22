import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppLogger } from './appLogger.service';
import { WinstonConfigService } from './logger.service';

@Global()
@Module({
    imports: [
        WinstonModule.forRootAsync({
            useClass: WinstonConfigService,
        }),
    ],
    providers: [WinstonConfigService, AppLogger],
    exports: [WinstonModule, AppLogger],
})
export class LoggerModule {}
