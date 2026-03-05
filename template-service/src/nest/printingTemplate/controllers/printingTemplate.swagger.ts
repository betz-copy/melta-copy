import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const ApiGetAllPrintingTemplates = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get all printing templates' }),
        ApiResponse({ status: 200, description: 'Printing templates retrieved successfully' }),
    );

export const ApiGetPrintingTemplateById = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get a printing template by ID' }),
        ApiParam({ name: 'id', description: 'Printing template ID' }),
        ApiResponse({ status: 200, description: 'Printing template retrieved successfully' }),
        ApiResponse({ status: 404, description: 'Printing template not found' }),
    );

export const ApiCreatePrintingTemplate = () =>
    applyDecorators(
        ApiOperation({ summary: 'Create a new printing template' }),
        ApiResponse({ status: 201, description: 'Printing template created successfully' }),
        ApiResponse({ status: 400, description: 'Invalid input data' }),
    );

export const ApiUpdatePrintingTemplate = () =>
    applyDecorators(
        ApiOperation({ summary: 'Update a printing template' }),
        ApiParam({ name: 'id', description: 'Printing template ID' }),
        ApiResponse({ status: 200, description: 'Printing template updated successfully' }),
        ApiResponse({ status: 404, description: 'Printing template not found' }),
        ApiResponse({ status: 400, description: 'Invalid input data' }),
    );

export const ApiDeletePrintingTemplate = () =>
    applyDecorators(
        ApiOperation({ summary: 'Delete a printing template' }),
        ApiParam({ name: 'id', description: 'Printing template ID' }),
        ApiResponse({ status: 200, description: 'Printing template deleted successfully' }),
        ApiResponse({ status: 404, description: 'Printing template not found' }),
    );
