import { Status } from '@packages/process';
import { leanOf } from '@packages/utils';
import z from 'zod';

export const UpdatedFieldsSchema = z.object({
    fieldName: z.string(),
    oldValue: z.unknown(),
    newValue: z.unknown(),
});

export type IUpdatedFields = z.infer<typeof UpdatedFieldsSchema>;

export const BaseActivityLogSchema = z.object({
    timestamp: z.coerce.date(),
    entityId: z.string(),
    userId: z.string(),
});

export type IBaseActivityLog = z.infer<typeof BaseActivityLogSchema>;

export enum ActionsLog {
    CREATE_ENTITY = 'CREATE_ENTITY',
    DISABLE_ENTITY = 'DISABLE_ENTITY',
    ACTIVATE_ENTITY = 'ACTIVATE_ENTITY',
    VIEW_ENTITY = 'VIEW_ENTITY',
    CREATE_PROCESS = 'CREATE_PROCESS',
    UPDATE_PROCESS = 'UPDATE_PROCESS',
    UPDATE_PROCESS_STEP = 'UPDATE_PROCESS_STEP',
    DELETE_RELATIONSHIP = 'DELETE_RELATIONSHIP',
    CREATE_RELATIONSHIP = 'CREATE_RELATIONSHIP',
    DUPLICATE_ENTITY = 'DUPLICATE_ENTITY',
    UPDATE_ENTITY = 'UPDATE_ENTITY',
    UPDATE_FIELDS = 'UPDATE_FIELDS',
}

export type IMongoBaseActivityLog = leanOf<IBaseActivityLog>;

export const EmptyMetadataSchema = BaseActivityLogSchema.extend({
    action: z.enum([
        ActionsLog.CREATE_ENTITY,
        ActionsLog.DISABLE_ENTITY,
        ActionsLog.ACTIVATE_ENTITY,
        ActionsLog.VIEW_ENTITY,
        ActionsLog.CREATE_PROCESS,
    ]),
    metadata: z.object({}).strict(),
});

export type IEmptyMetadata = z.infer<typeof EmptyMetadataSchema>;

export const RelationshipMetadataSchema = BaseActivityLogSchema.extend({
    action: z.enum([ActionsLog.DELETE_RELATIONSHIP, ActionsLog.CREATE_RELATIONSHIP]),
    metadata: z.object({
        relationshipId: z.string(),
        relationshipTemplateId: z.string(),
        entityId: z.string(),
    }),
});

export type IRelationshipMetadata = z.infer<typeof RelationshipMetadataSchema>;

export const DuplicateEntityMetadataSchema = BaseActivityLogSchema.extend({
    action: z.literal(ActionsLog.DUPLICATE_ENTITY),
    metadata: z.object({ entityIdDuplicatedFrom: z.string() }),
});

export type IDuplicateEntityMetadata = z.infer<typeof DuplicateEntityMetadataSchema>;

export const UpdateEntityMetadataSchema = BaseActivityLogSchema.extend({
    action: z.enum([ActionsLog.UPDATE_ENTITY, ActionsLog.UPDATE_PROCESS]),
    metadata: z.object({
        updatedFields: z.array(UpdatedFieldsSchema),
    }),
});

export type IUpdateEntityMetadata = z.infer<typeof UpdateEntityMetadataSchema>;

export const UpdateProcessStepMetadataSchema = BaseActivityLogSchema.extend({
    action: z.literal(ActionsLog.UPDATE_PROCESS_STEP),
    metadata: z.object({
        updatedFields: z.array(UpdatedFieldsSchema).optional(),
        comments: z.string().optional(),
        status: z.enum([Status.Approved, Status.Pending, Status.Rejected]).optional(),
    }),
});

export type IUpdateProcessStepMetadata = z.infer<typeof UpdateProcessStepMetadataSchema>;

export const ActivityLogSchema = z.discriminatedUnion('action', [
    EmptyMetadataSchema,
    RelationshipMetadataSchema,
    DuplicateEntityMetadataSchema,
    UpdateEntityMetadataSchema,
    UpdateProcessStepMetadataSchema,
]);

export type IActivityLog = z.infer<typeof ActivityLogSchema>;

export type IMongoActivityLog = leanOf<IActivityLog>;

export type IMongoUpdateProcessStepMetadata = leanOf<IUpdateProcessStepMetadata>;
