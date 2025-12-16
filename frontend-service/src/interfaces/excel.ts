import {
    ActionErrors,
    ActionTypes,
    IAction,
    IActionMetadataPopulated,
    IBrokenRule,
    IBrokenRulePopulated,
    ICreateEntityMetadata,
    IEntity,
    IEntitySingleProperty,
    IEntityWithIgnoredRules,
    IMongoChildTemplateWithConstraintsPopulated,
    IMongoEntityTemplateWithConstraintsPopulated,
    IRequiredConstraint,
    IUniqueConstraint,
    IUsersNotFoundError,
} from '@microservices/shared';

export interface EntitiesWizardValues {
    files?: File[];
    template?: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated;
}

export type IValidationError = {
    message: string;
    path: string;
    schemaPath: string;
    params: Partial<IEntitySingleProperty> & { allowedValues?: string[] };
};

export type IBrokenRuleEntity = {
    rawBrokenRules: IBrokenRule[];
    brokenRules: IBrokenRulePopulated[];
    actions: {
        actionType: ActionTypes;
        actionMetadata: IActionMetadataPopulated;
    }[];
    rawActions: IAction[];
    entities: { properties: Record<string, any> | IEntity['properties'] }[];
};

export interface IError {
    type: ActionErrors;
    metadata: IValidationError | IUniqueConstraint | IRequiredConstraint | IUsersNotFoundError;
}

export interface IFailedEntity {
    properties: Record<string, any>;
    errors: IError[];
    coloredFields?: Record<string, string>;
}

export interface ITablesResults {
    succeededEntities: ICreateEntityMetadata[];
    failedEntities: IFailedEntity[];
    brokenRulesEntities?: IBrokenRuleEntity;
}

export interface IStatusEntitiesTables {
    succeededEntities: ICreateEntityMetadata[];
    failedEntities: IFailedEntity[];
    brokenRulesEntities?: IBrokenRuleEntity['entities'];
}

export enum ExcelStepStatus {
    uploadExcel = 'uploadExcel',
    previewExcelRows = 'previewExcelRows',
    excelUploadResult = 'excelUploadResult',
}
export interface IExcelSteps {
    status: ExcelStepStatus;
    files?: Record<string, File>;
    data: ITablesResults;
    entities?: IEntityWithIgnoredRules[];
}

export interface IEditReadExcel {
    failedEntities: IFailedEntity[];
    entities: IEntityWithIgnoredRules[];
}
