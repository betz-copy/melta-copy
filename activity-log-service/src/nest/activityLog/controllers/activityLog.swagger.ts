import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, getSchemaPath } from '@nestjs/swagger';
import { GetActivityQueryDto } from '../dto/activityLog.dto';
import { ActivityLog } from '../schemas/activityLog.schema';

export const ApiGetActivity = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Get activity log for an entity',
            description:
                'Returns a paginated list of activity log entries for the given entity. Supports filtering by action, user, fields, full-text search, and date range.',
        }),
        ApiParam({
            name: 'entityId',
            description: 'Entity identifier',
            example: 'entity-id',
        }),
        ApiQuery({ type: GetActivityQueryDto }),
        ApiOkResponse({
            description: 'Paginated activity log response',
            schema: {
                type: 'object',
                properties: {
                    data: {
                        type: 'array',
                        items: { $ref: getSchemaPath(ActivityLog) },
                    },
                    pagination: {
                        type: 'object',
                        properties: {
                            limit: { type: 'number', example: 10 },
                            skip: { type: 'number', example: 0 },
                            total: { type: 'number', example: 124 },
                        },
                    },
                },
            },
        }),
    );
