import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { GetActivityQueryDto } from '../dto/activityLog.dto';
import { ActivityLog } from '../schemas/activityLog.schema';
import { ActivityLogService } from '../services/activityLog.service';
import { ApiGetActivity } from './activityLog.swagger';

@ApiTags('Activity Log')
@ApiExtraModels(ActivityLog)
@Controller('api/activity-log')
export class ActivityLogController {
    constructor(private readonly activityLogService: ActivityLogService) {}

    @Get(':entityId')
    @ApiGetActivity()
    getActivity(@Param('entityId') entityId: string, @Query() query: GetActivityQueryDto) {
        return this.activityLogService.getActivity(entityId, query);
    }
}
