import { Module } from '@nestjs/common';
import { MongoModelFactory } from '@packages/utils';
import { EntityTemplateController } from './controllers/entityTemplate.controller';
import { EntityTemplateService } from './services/entityTemplate.service';
import { CategoryModule } from '../category/category.module';
import { RelationshipTemplateModule } from '../relationshipTemplate/relationshipTemplate.module';

@Module({
    imports: [CategoryModule, RelationshipTemplateModule],
    controllers: [EntityTemplateController],
    providers: [EntityTemplateService, MongoModelFactory],
    exports: [EntityTemplateService],
})
export class EntityTemplateModule {}
