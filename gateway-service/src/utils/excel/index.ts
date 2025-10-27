import {
    ActionErrors,
    ActionTypes,
    BadRequestError,
    IBrokenRuleEntity,
    IBrokenRulesError,
    IChildTemplatePopulated,
    IEntity,
    IFailedEntity,
    IMongoEntityTemplatePopulated,
    IWorkspace,
    ServiceError,
    UploadedFile,
} from '@microservices/shared';
import { AxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import { getValidationErrorEntities, readExcelFile } from './getFunctions';

const { errorCodes, loadExcel } = config;

export const getAllEntitiesFromExcel = async (
    files: UploadedFile[],
    template: IMongoEntityTemplatePopulated | IChildTemplatePopulated,
    failedEntities: IFailedEntity[],
    workspace: IWorkspace,
) => {
    const workspaceFilesLimit = workspace.metadata?.excel?.filesLimit;

    const effectiveFilesLimit = workspaceFilesLimit ?? loadExcel.filesLimit;
    if (files.length > effectiveFilesLimit) throw new BadRequestError(`files limit: more than ${effectiveFilesLimit} files`, {});

    return readExcelFile(files, template, failedEntities, workspace.metadata?.excel?.entitiesFileLimit);
};

export const generateSerialNumbers = (index: number, serialStarters: Record<string, number>) =>
    Object.fromEntries(Object.entries(serialStarters).map(([key, value]) => [key, value + index]));

export const getSerialStarters = (template: IMongoEntityTemplatePopulated | IChildTemplatePopulated): Record<string, number> => {
    return Object.entries(template.properties.properties)
        .filter(([_key, value]) => value.type === 'number' && value.serialStarter !== undefined)
        .reduce((acc, [key, value]) => {
            acc[key] = value.serialCurrent || 0;
            return acc;
        }, {});
};

export const classifyEntityErrors = (error: any, failedEntities: IFailedEntity[], entity: IEntity, allBrokenRulesEntities: IBrokenRuleEntity[]) => {
    if (error instanceof AxiosError) {
        if (!error.response) throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'no error. response in axiosError', error);

        const { data } = error.response;
        if (typeof data.StatusCodes === 'string')
            if (data.StatusCodes === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                const templateIdMatch = error.message.match(loadExcel.templateIdRegex);
                const templateId = templateIdMatch ? templateIdMatch[1] : '';

                const propertiesMatch = error.message.match(loadExcel.propertiesRegex);
                const properties = propertiesMatch ? propertiesMatch[1].replace(/`/g, '').split(', ') : [];

                failedEntities.push({
                    properties: entity.properties,
                    errors: [
                        {
                            type: ActionErrors.unique,
                            metadata: { type: ActionErrors.unique, constraintName: '', templateId, properties, uniqueGroupName: '' },
                        },
                    ],
                });
            }

        if (data.metadata && data.metadata.errorCode === errorCodes.failedConstraintsValidation) {
            const { constraint } = data.metadata;
            switch (constraint.type) {
                case ActionErrors.unique:
                    failedEntities.push({
                        properties: entity.properties,
                        errors: [{ type: ActionErrors.unique, metadata: constraint }],
                    });
                    break;
                case ActionErrors.required:
                    failedEntities.push({
                        properties: entity.properties,
                        errors: [{ type: ActionErrors.required, metadata: constraint }],
                    });
                    break;
                default:
                    break;
            }
        }

        if (data.type === errorCodes.templateValidationError || data.type === 'FilterValidationError')
            getValidationErrorEntities(error as AxiosError, failedEntities);
    } else if ((error as IBrokenRulesError).metadata.errorCode === errorCodes.ruleBlock) {
        allBrokenRulesEntities.push({
            brokenRules: error.metadata.brokenRules,
            rawBrokenRules: error.metadata.rawBrokenRules,
            actions: error.metadata.actions ?? [
                {
                    actionType: ActionTypes.CreateEntity,
                    actionMetadata: entity,
                },
            ],
            rawActions: error.metadata.rawActions ?? [
                {
                    actionType: ActionTypes.CreateEntity,
                    actionMetadata: entity,
                },
            ],
            entities: [{ properties: entity.properties }],
        });
    }
};
