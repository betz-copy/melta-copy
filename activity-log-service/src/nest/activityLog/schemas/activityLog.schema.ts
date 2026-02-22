import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ActionsLog } from '@packages/activity-log';
import { HydratedDocument } from 'mongoose';

export type ActivityLogDocument = HydratedDocument<ActivityLog>;

@Schema()
export class ActivityLog {
    @ApiProperty({ type: String, format: 'date-time', example: '2026-01-12T11:28:52.559Z' })
    @Prop({ required: true })
    timestamp: Date;

    @ApiProperty({ example: '6289c5fb-0075-4b3c-b829-6600032484aa' })
    @Prop({ required: true })
    entityId: string;

    @ApiProperty({ example: '6996ccc14842d5e948a35491' })
    @Prop({ required: true })
    userId: string;

    @ApiProperty({ enum: ActionsLog, example: 'UPDATE_ENTITY' })
    @Prop({ required: true, type: String, enum: ActionsLog })
    action: ActionsLog;

    @ApiProperty({ example: { updatedFields: [{ fieldName: 'age', oldValue: 65, newValue: 66 }] } })
    @Prop({ type: Object, required: true })
    metadata: Record<string, unknown>;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

ActivityLogSchema.index({ entityId: 1, timestamp: -1 });

ActivityLogSchema.index(
    { entityId: 1, userId: 1 },
    {
        unique: true,
        partialFilterExpression: { action: ActionsLog.VIEW_ENTITY },
    },
);

ActivityLogSchema.index({ action: 1 });

ActivityLogSchema.index({ userId: 1 });

ActivityLogSchema.index({ 'metadata.updatedFields': 1 });

ActivityLogSchema.index({
    action: 'text',
    'metadata.updatedFields.fieldName': 'text',
    'metadata.updatedFields.oldValue': 'text',
    'metadata.updatedFields.newValue': 'text',
});
