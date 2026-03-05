import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { CreateCategoryDto, GetCategoriesQueryDto, UpdateCategoryDto, UpdateTemplatesOrderDto } from '../dto/category.dto';
import { Category } from '../schemas/category.schema';
import { CategoryService } from '../services/category.service';
import {
    ApiGetCategories,
    ApiGetCategoryById,
    ApiCreateCategory,
    ApiUpdateCategory,
    ApiDeleteCategory,
    ApiUpdateTemplatesOrder,
} from './category.swagger';

@ApiTags('Categories')
@ApiExtraModels(Category)
@Controller('api/templates/categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get()
    @ApiGetCategories()
    async getCategories(@Query() query: GetCategoriesQueryDto) {
        return this.categoryService.getCategories(query.search);
    }

    @Get(':categoryId')
    @ApiGetCategoryById()
    async getCategoryById(@Param('categoryId') categoryId: string) {
        return this.categoryService.getCategoryById(categoryId);
    }

    @Post()
    @ApiCreateCategory()
    async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoryService.createCategory(createCategoryDto);
    }

    @Delete(':categoryId')
    @ApiDeleteCategory()
    async deleteCategory(@Param('categoryId') categoryId: string) {
        return this.categoryService.deleteCategory(categoryId);
    }

    @Put(':categoryId')
    @ApiUpdateCategory()
    async updateCategory(@Param('categoryId') categoryId: string, @Body() updateCategoryDto: UpdateCategoryDto) {
        return this.categoryService.updateCategory(categoryId, updateCategoryDto);
    }

    @Patch('templatesOrder/:templateId')
    @ApiUpdateTemplatesOrder()
    async updateCategoryTemplatesOrder(@Param('templateId') templateId: string, @Body() updateTemplatesOrderDto: UpdateTemplatesOrderDto) {
        const { newCategoryId, srcCategoryId, newIndex } = updateTemplatesOrderDto;
        return this.categoryService.updateCategoryTemplatesOrder(templateId, newCategoryId, srcCategoryId, newIndex);
    }
}
