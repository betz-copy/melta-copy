import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { Category } from '../schemas/category.schema';

export const ApiGetCategories = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get all categories', description: 'Retrieve all categories, optionally filtered by displayName search' }),
        ApiQuery({ name: 'search', required: false, description: 'Search term for category displayName', type: String }),
        ApiResponse({ status: 200, description: 'List of categories', type: [Category] }),
    );

export const ApiGetCategoryById = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get category by ID', description: 'Retrieve a single category by its ID' }),
        ApiParam({ name: 'categoryId', description: 'MongoDB ObjectId of the category', type: String }),
        ApiResponse({ status: 200, description: 'Category found', type: Category }),
        ApiResponse({ status: 404, description: 'Category not found' }),
    );

export const ApiCreateCategory = () =>
    applyDecorators(
        ApiOperation({ summary: 'Create a new category', description: 'Create a new category with the provided data' }),
        ApiResponse({ status: 201, description: 'Category created successfully', type: Category }),
        ApiResponse({ status: 400, description: 'Invalid input data' }),
    );

export const ApiUpdateCategory = () =>
    applyDecorators(
        ApiOperation({ summary: 'Update a category', description: 'Update an existing category by its ID' }),
        ApiParam({ name: 'categoryId', description: 'MongoDB ObjectId of the category', type: String }),
        ApiResponse({ status: 200, description: 'Category updated successfully', type: Category }),
        ApiResponse({ status: 404, description: 'Category not found' }),
    );

export const ApiDeleteCategory = () =>
    applyDecorators(
        ApiOperation({ summary: 'Delete a category', description: 'Delete a category by its ID' }),
        ApiParam({ name: 'categoryId', description: 'MongoDB ObjectId of the category', type: String }),
        ApiResponse({ status: 200, description: 'Category deleted successfully', type: Category }),
        ApiResponse({ status: 404, description: 'Category not found' }),
    );

export const ApiUpdateTemplatesOrder = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Update template order between categories',
            description: 'Move a template from one category to another and update its position',
        }),
        ApiParam({ name: 'templateId', description: 'MongoDB ObjectId of the template to move', type: String }),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    newCategoryId: { type: 'string', description: 'Target category ID' },
                    srcCategoryId: { type: 'string', description: 'Source category ID' },
                    newIndex: { type: 'number', description: 'New position index in target category' },
                },
                required: ['newCategoryId', 'srcCategoryId', 'newIndex'],
            },
        }),
        ApiResponse({
            status: 200,
            description: 'Template order updated successfully',
            schema: {
                type: 'object',
                properties: {
                    oldCategory: { $ref: '#/components/schemas/Category' },
                    newCategory: { $ref: '#/components/schemas/Category' },
                },
            },
        }),
        ApiResponse({ status: 404, description: 'Category not found' }),
    );
