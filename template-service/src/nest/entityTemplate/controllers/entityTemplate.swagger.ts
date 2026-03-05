import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { EntityTemplate } from '../schemas/entityTemplate.schema';

export const ApiSearchTemplates = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Search entity templates',
            description: 'Search entity templates by name, IDs, or category',
        }),
        ApiBody({
            description: 'Search criteria',
            schema: {
                type: 'object',
                properties: {
                    search: { type: 'string', description: 'Search term' },
                    ids: { type: 'array', items: { type: 'string' } },
                    categoryIds: { type: 'array', items: { type: 'string' } },
                    limit: { type: 'number', default: 10 },
                    skip: { type: 'number', default: 0 },
                },
            },
        }),
        ApiResponse({ status: 200, description: 'List of templates', type: [EntityTemplate] }),
    );

export const ApiSearchByFormat = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Search entity templates by property format',
            description: 'Find all entity templates that have properties with a specific format',
        }),
        ApiResponse({ status: 200, description: 'List of templates with format', type: [EntityTemplate] }),
    );

export const ApiGetAllTemplates = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get all entity templates',
            description: 'Retrieve all entity templates in the system',
        }),
        ApiResponse({ status: 200, description: 'All templates', type: [EntityTemplate] }),
    );

export const ApiGetTemplatesByCategory = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get templates by category',
            description: 'Retrieve all templates in a specific category',
        }),
        ApiParam({ name: 'categoryId', description: 'Category MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Templates in category', type: [EntityTemplate] }),
    );

export const ApiGetTemplateById = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get entity template by ID',
            description: 'Retrieve a single entity template with all its properties',
        }),
        ApiParam({ name: 'templateId', description: 'Template MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Entity template found', type: EntityTemplate }),
        ApiResponse({ status: 404, description: 'Template not found' }),
    );

export const ApiCreateTemplate = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Create entity template',
            description: 'Create a new entity template with all properties and configurations',
        }),
        ApiResponse({ status: 201, description: 'Template created', type: EntityTemplate }),
        ApiResponse({ status: 400, description: 'Invalid input' }),
    );

export const ApiUpdateTemplate = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Update entity template',
            description: 'Update all or partial fields of an entity template',
        }),
        ApiParam({ name: 'templateId', description: 'Template MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Template updated', type: EntityTemplate }),
        ApiResponse({ status: 404, description: 'Template not found' }),
    );

export const ApiUpdateStatus = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Update template enabled/disabled status',
            description: 'Enable or disable an entity template',
        }),
        ApiParam({ name: 'templateId', description: 'Template MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Status updated', type: EntityTemplate }),
        ApiResponse({ status: 404, description: 'Template not found' }),
    );

export const ApiUpdateAction = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Update template action code',
            description: 'Update the action code for an entity template',
        }),
        ApiParam({ name: 'templateId', description: 'Template MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Action updated', type: EntityTemplate }),
        ApiResponse({ status: 404, description: 'Template not found' }),
    );

export const ApiDeleteTemplate = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Delete entity template',
            description: 'Delete an entity template and its associated relationships',
        }),
        ApiParam({ name: 'templateId', description: 'Template MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Template deleted', type: EntityTemplate }),
        ApiResponse({ status: 404, description: 'Template not found' }),
    );
