import { Status } from '@packages/process';
import { leanOf } from '@packages/utils';
import z from 'zod';

// export interface IUpdatedFields {
//     fieldName: string;
//     oldValue: IPropertyValue;
//     newValue: IPropertyValue;
// }

export const UpdatedFieldsSchema = z.object({
    fieldName: z.string(),
    oldValue: z.unknown(),
    newValue: z.unknown(),
});

export type IUpdatedFields = z.infer<typeof UpdatedFieldsSchema>;

// interface IBaseActivityLog {
//     timestamp: Date;
//     entityId: string;
//     userId: string;
// }

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

// export interface IMongoBaseActivityLog extends IBaseActivityLog {
//     _id: string;
// }

export type IMongoBaseActivityLog = leanOf<IBaseActivityLog>;

// interface IEmptyMetadata extends IBaseActivityLog {
//     action: ActionsLog.CREATE_ENTITY | ActionsLog.DISABLE_ENTITY | ActionsLog.ACTIVATE_ENTITY | ActionsLog.VIEW_ENTITY | ActionsLog.CREATE_PROCESS;
//     metadata: object;
// }

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

// interface IRelationshipMetadata extends IBaseActivityLog {
//     action: ActionsLog.DELETE_RELATIONSHIP | ActionsLog.CREATE_RELATIONSHIP;
//     metadata: {
//         relationshipId: string;
//         relationshipTemplateId: string;
//         entityId: string;
//     };
// }

export const RelationshipMetadataSchema = BaseActivityLogSchema.extend({
    action: z.enum([ActionsLog.DELETE_RELATIONSHIP, ActionsLog.CREATE_RELATIONSHIP]),
    metadata: z.object({
        relationshipId: z.string(),
        relationshipTemplateId: z.string(),
        entityId: z.string(),
    }),
});

export type IRelationshipMetadata = z.infer<typeof RelationshipMetadataSchema>;

// interface IDuplicateEntityMetadata extends IBaseActivityLog {
//     action: ActionsLog.DUPLICATE_ENTITY;
//     metadata: { entityIdDuplicatedFrom: string };
// }

export const DuplicateEntityMetadataSchema = BaseActivityLogSchema.extend({
    action: z.literal(ActionsLog.DUPLICATE_ENTITY),
    metadata: z.object({ entityIdDuplicatedFrom: z.string() }),
});

export type IDuplicateEntityMetadata = z.infer<typeof DuplicateEntityMetadataSchema>;

// interface IUpdateEntityMetadata extends IBaseActivityLog {
//     action: ActionsLog.UPDATE_ENTITY | ActionsLog.UPDATE_PROCESS | ActionsLog.UPDATE_FIELDS;
//     metadata: { updatedFields: IUpdatedFields[] };
// }

export const UpdateEntityMetadataSchema = BaseActivityLogSchema.extend({
    action: z.enum([ActionsLog.UPDATE_ENTITY, ActionsLog.UPDATE_PROCESS]),
    metadata: z.object({
        updatedFields: z.array(UpdatedFieldsSchema),
    }),
});

export type IUpdateEntityMetadata = z.infer<typeof UpdateEntityMetadataSchema>;

// export interface IUpdateProcessStepMetadata extends IBaseActivityLog {
//     action: ActionsLog.UPDATE_PROCESS_STEP;
//     metadata: { updatedFields?: IUpdatedFields[]; comments?: string; status?: Status };
// }

export const UpdateProcessStepMetadataSchema = BaseActivityLogSchema.extend({
    action: z.literal(ActionsLog.UPDATE_PROCESS_STEP),
    metadata: z.object({
        updatedFields: z.array(UpdatedFieldsSchema).optional(),
        comments: z.string().optional(),
        status: z.enum([Status.Approved, Status.Pending, Status.Rejected]).optional(),
    }),
});

export type IUpdateProcessStepMetadata = z.infer<typeof UpdateProcessStepMetadataSchema>;

// export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata | IUpdateProcessStepMetadata;

export const ActivityLogSchema = z.discriminatedUnion('action', [
    EmptyMetadataSchema,
    RelationshipMetadataSchema,
    DuplicateEntityMetadataSchema,
    UpdateEntityMetadataSchema,
    UpdateProcessStepMetadataSchema,
]);

export type IActivityLog = z.infer<typeof ActivityLogSchema>;

// export type IMongoActivityLog = IActivityLog & { _id: string };

export type IMongoActivityLog = leanOf<IActivityLog>;

// export interface IMongoUpdateProcessStepMetadata extends IUpdateProcessStepMetadata {
//     _id: string;
// }
export type IMongoUpdateProcessStepMetadata = leanOf<IUpdateProcessStepMetadata>;
