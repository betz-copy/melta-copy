import { Module } from '@nestjs/common';
import { MongoModelFactory } from '@packages/utils';
import { CategoryController } from './controllers/category.controller';
import { CategoryService } from './services/category.service';
import { ConfigModule as TemplateConfigModule } from '../config/config.module';

@Module({
    imports: [TemplateConfigModule],
    controllers: [CategoryController],
    providers: [CategoryService, MongoModelFactory],
    exports: [CategoryService],
})
export class CategoryModule {}
