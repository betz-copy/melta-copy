import { Module } from '@nestjs/common';
import { MongoModelFactory } from '@packages/utils';
import { PrintingTemplateController } from './controllers/printingTemplate.controller';
import { PrintingTemplateService } from './services/printingTemplate.service';

@Module({
    controllers: [PrintingTemplateController],
    providers: [PrintingTemplateService, MongoModelFactory],
    exports: [PrintingTemplateService],
})
export class PrintingTemplateModule {}
