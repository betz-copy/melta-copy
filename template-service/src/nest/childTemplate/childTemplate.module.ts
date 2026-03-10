import { Module } from '@nestjs/common';
import { MongoModelFactory } from '@packages/utils';
import { ChildTemplateController } from './controllers/childTemplate.controller';
import { ChildTemplateService } from './services/childTemplate.service';

@Module({
    controllers: [ChildTemplateController],
    providers: [ChildTemplateService, MongoModelFactory],
    exports: [ChildTemplateService],
})
export class ChildTemplateModule {}
