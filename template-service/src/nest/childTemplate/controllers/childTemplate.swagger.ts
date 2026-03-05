import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const ApiGetAllChildTemplates = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get all child templates' }),
        ApiResponse({ status: 200, description: 'Child templates retrieved successfully' }),
    );

export const ApiGetChildTemplateById = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get a child template by ID' }),
        ApiParam({ name: 'id', description: 'Child template ID' }),
        ApiResponse({ status: 200, description: 'Child template retrieved successfully' }),
        ApiResponse({ status: 404, description: 'Child template not found' }),
    );

export const ApiGetChildTemplatesByParent = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get all child templates for a parent template' }),
        ApiParam({ name: 'parentTemplateId', description: 'Parent template ID' }),
        ApiResponse({ status: 200, description: 'Child templates retrieved successfully' }),
    );

export const ApiCreateChildTemplate = () =>
    applyDecorators(
        ApiOperation({ summary: 'Create a new child template' }),
        ApiResponse({ status: 201, description: 'Child template created successfully' }),
        ApiResponse({ status: 400, description: 'Invalid input data' }),
    );

export const ApiUpdateChildTemplate = () =>
    applyDecorators(
        ApiOperation({ summary: 'Update a child template' }),
        ApiParam({ name: 'id', description: 'Child template ID' }),
        ApiResponse({ status: 200, description: 'Child template updated successfully' }),
        ApiResponse({ status: 404, description: 'Child template not found' }),
        ApiResponse({ status: 400, description: 'Invalid input data' }),
    );

export const ApiDeleteChildTemplate = () =>
    applyDecorators(
        ApiOperation({ summary: 'Delete a child template' }),
        ApiParam({ name: 'id', description: 'Child template ID' }),
        ApiResponse({ status: 200, description: 'Child template deleted successfully' }),
        ApiResponse({ status: 404, description: 'Child template not found' }),
    );
