import { Module } from '@nestjs/common';
import { MongoModelFactory } from '@packages/utils';
import { RelationshipTemplateController } from './controllers/relationshipTemplate.controller';
import { RelationshipTemplateService } from './services/relationshipTemplate.service';

@Module({
    controllers: [RelationshipTemplateController],
    providers: [RelationshipTemplateService, MongoModelFactory],
    exports: [RelationshipTemplateService],
})
export class RelationshipTemplateModule {}
