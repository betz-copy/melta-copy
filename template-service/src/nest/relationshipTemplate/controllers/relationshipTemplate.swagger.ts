import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RelationshipTemplate } from '../schemas/relationshipTemplate.schema';

export const ApiSearchRelationships = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Search relationship templates',
            description: 'Search relationship templates by name or entity IDs',
        }),
        ApiResponse({ status: 200, description: 'List of relationships', type: [RelationshipTemplate] }),
    );

export const ApiGetAllRelationships = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get all relationship templates',
            description: 'Retrieve all relationship templates in the system',
        }),
        ApiResponse({ status: 200, description: 'All relationships', type: [RelationshipTemplate] }),
    );

export const ApiGetRelationshipById = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get relationship template by ID',
            description: 'Retrieve a single relationship template',
        }),
        ApiParam({ name: 'relationshipId', description: 'Relationship MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Relationship found', type: RelationshipTemplate }),
        ApiResponse({ status: 404, description: 'Relationship not found' }),
    );

export const ApiCreateRelationship = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Create relationship template',
            description: 'Create a new relationship template between two entity templates',
        }),
        ApiResponse({ status: 201, description: 'Relationship created', type: RelationshipTemplate }),
    );

export const ApiUpdateRelationship = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Update relationship template',
            description: 'Update an existing relationship template',
        }),
        ApiParam({ name: 'relationshipId', description: 'Relationship MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Relationship updated', type: RelationshipTemplate }),
        ApiResponse({ status: 404, description: 'Relationship not found' }),
    );

export const ApiDeleteRelationship = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Delete relationship template',
            description: 'Delete a relationship template',
        }),
        ApiParam({ name: 'relationshipId', description: 'Relationship MongoDB ObjectId' }),
        ApiResponse({ status: 200, description: 'Relationship deleted', type: RelationshipTemplate }),
        ApiResponse({ status: 404, description: 'Relationship not found' }),
    );
