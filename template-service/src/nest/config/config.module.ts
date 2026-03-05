import { Module } from '@nestjs/common';
import { MongoModelFactory } from '@packages/utils';
import { ConfigService } from './services/config.service';

@Module({
    providers: [ConfigService, MongoModelFactory],
    exports: [ConfigService],
})
export class ConfigModule {}
