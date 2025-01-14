interface IBaseActivityLog {
    timestamp: Date;
    entityId: string;
    userId: string;
}

interface IEmptyMetadata extends IBaseActivityLog {
    action: 'CREATE_ENTITY' | 'DISABLE_ENTITY' | 'ACTIVATE_ENTITY' | 'VIEW_ENTITY' | 'CREATE_PROCESS';
    metadata: {};
}

interface IRelationshipMetadata extends IBaseActivityLog {
    action: 'DELETE_RELATIONSHIP' | 'CREATE_RELATIONSHIP';
    metadata: { relationshipId: string; relationshipTemplateId: string; entityId: string };
}

interface IDuplicateEntityMetadata extends IBaseActivityLog {
    action: 'DUPLICATE_ENTITY';
    metadata: { entityIdDuplicatedFrom: string };
}

interface IUpdateEntityMetadata extends IBaseActivityLog {
    action: 'UPDATE_ENTITY' | 'UPDATE_PROCESS';
    metadata: { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] };
}

interface IUpdateProcessStepMetadata extends IBaseActivityLog {
    action: 'UPDATE_PROCESS_STEP';
    metadata: { updatedFields?: [{ fieldName: string; oldValue: any; newValue: any }]; comments?: string; status?: string };
}

export enum Action {
    'DELETE_RELATIONSHIP',
    'CREATE_RELATIONSHIP',
    'UPDATE_ENTITY',
    'CREATE_ENTITY',
    'CREATE_PROCESS',
    'UPDATE_PROCESS',
    'UPDATE_PROCESS_STEP',
    'DISABLE_ENTITY',
    'ACTIVATE_ENTITY',
    'VIEW_ENTITY',
}

export type IActivityLog = IEmptyMetadata | IRelationshipMetadata | IDuplicateEntityMetadata | IUpdateEntityMetadata | IUpdateProcessStepMetadata;
