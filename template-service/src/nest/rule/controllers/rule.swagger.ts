import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const ApiGetAllRules = () =>
    applyDecorators(ApiOperation({ summary: 'Get all rules' }), ApiResponse({ status: 200, description: 'Rules retrieved successfully' }));

export const ApiGetRuleById = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get a rule by ID' }),
        ApiParam({ name: 'id', description: 'Rule ID' }),
        ApiResponse({ status: 200, description: 'Rule retrieved successfully' }),
        ApiResponse({ status: 404, description: 'Rule not found' }),
    );

export const ApiGetRulesByEntity = () =>
    applyDecorators(
        ApiOperation({ summary: 'Get all rules for an entity template' }),
        ApiParam({ name: 'entityTemplateId', description: 'Entity template ID' }),
        ApiResponse({ status: 200, description: 'Rules retrieved successfully' }),
    );

export const ApiCreateRule = () =>
    applyDecorators(
        ApiOperation({ summary: 'Create a new rule' }),
        ApiResponse({ status: 201, description: 'Rule created successfully' }),
        ApiResponse({ status: 400, description: 'Invalid input data' }),
    );

export const ApiUpdateRule = () =>
    applyDecorators(
        ApiOperation({ summary: 'Update a rule' }),
        ApiParam({ name: 'id', description: 'Rule ID' }),
        ApiResponse({ status: 200, description: 'Rule updated successfully' }),
        ApiResponse({ status: 404, description: 'Rule not found' }),
        ApiResponse({ status: 400, description: 'Invalid input data' }),
    );

export const ApiDeleteRule = () =>
    applyDecorators(
        ApiOperation({ summary: 'Delete a rule' }),
        ApiParam({ name: 'id', description: 'Rule ID' }),
        ApiResponse({ status: 200, description: 'Rule deleted successfully' }),
        ApiResponse({ status: 404, description: 'Rule not found' }),
    );
