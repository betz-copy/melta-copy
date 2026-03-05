import { Module } from '@nestjs/common';
import { MongoModelFactory } from '@packages/utils';
import { RuleController } from './controllers/rule.controller';
import { RuleService } from './services/rule.service';

@Module({
    controllers: [RuleController],
    providers: [RuleService, MongoModelFactory],
    exports: [RuleService],
})
export class RuleModule {}
