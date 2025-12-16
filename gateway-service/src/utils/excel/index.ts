import {
    ActionErrors,
    ActionTypes,
    BadRequestError,
    IBrokenRuleEntity,
    IBrokenRulesError,
    IChildTemplatePopulated,
    IEntity,
    IExcelNotFoundError,
    IFailedEntity,
    IFailedEntityError,
    IMongoEntityTemplatePopulated,
    IValidationError,
    IWorkspace,
    ServiceError,
    UploadedFile,
    ValidationError,
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
    relatedTemplatesMap: Record<string, IMongoEntityTemplatePopulated>,
    userUnits?: string[],
) => {
    const workspaceFilesLimit = workspace.metadata?.excel?.filesLimit;

    const effectiveFilesLimit = workspaceFilesLimit ?? loadExcel.filesLimit;
    if (files.length > effectiveFilesLimit) throw new BadRequestError(`files limit: more than ${effectiveFilesLimit} files`, {});

    return readExcelFile(
        files,
        template,
        failedEntities,
        relatedTemplatesMap,
        workspace._id,
        workspace.metadata?.excel?.entitiesFileLimit,
        userUnits,
    );
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

export const classifyEntityErrors = (
    error: any,
    failedEntities: IFailedEntity[],
    entity: IEntity,
    allBrokenRulesEntities: IBrokenRuleEntity[],
    originalEntity?: IEntity['properties'],
) => {
    const properties = {
        ...entity.properties,
        ...(originalEntity || {}),
    };

    if (error instanceof AggregateError) {
        const fixedErrors: IFailedEntityError[] = error.errors.map((err) => ({ type: ActionErrors.notFound, metadata: err.metadata }));

        failedEntities.push({
            properties,
            errors: fixedErrors,
        });
        return;
    }

    if (error instanceof ServiceError && error.code === StatusCodes.NOT_FOUND) {
        failedEntities.push({
            properties,
            errors: [{ type: ActionErrors.notFound, metadata: error.metadata as IExcelNotFoundError }],
        });
        return;
    }

    if (error instanceof ValidationError) {
        failedEntities.push({
            properties,
            errors: [{ type: ActionErrors.validation, metadata: error.metadata as IValidationError }],
        });
        return;
    }

    if (error instanceof ValidationError && error?.metadata && (error.metadata as IValidationError).path) {
        failedEntities.push({
            properties,
            errors: [{ type: ActionErrors.validation, metadata: error.metadata as IValidationError }],
        });
    }

    if (error instanceof AxiosError) {
        if (!error.response) throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, 'no error. response in axiosError', error);

        const { data } = error.response;

        if (typeof data.StatusCodes === 'string')
            if (data.StatusCodes === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
                const templateIdMatch = error.message.match(loadExcel.templateIdRegex);
                const templateId = templateIdMatch ? templateIdMatch[1] : '';

                const propertiesMatch = error.message.match(loadExcel.propertiesRegex);
                const propertiesError = propertiesMatch ? propertiesMatch[1].replace(/`/g, '').split(', ') : [];

                failedEntities.push({
                    properties,
                    errors: [
                        {
                            type: ActionErrors.unique,
                            metadata: { type: ActionErrors.unique, constraintName: '', templateId, properties: propertiesError, uniqueGroupName: '' },
                        },
                    ],
                });
            }

        if (data.metadata && data.metadata?.errorCode === errorCodes.failedConstraintsValidation) {
            const { constraint } = data.metadata;
            switch (constraint.type) {
                case ActionErrors.unique:
                    failedEntities.push({
                        properties,
                        errors: [{ type: ActionErrors.unique, metadata: constraint }],
                    });
                    break;
                case ActionErrors.required:
                    failedEntities.push({
                        properties,
                        errors: [{ type: ActionErrors.required, metadata: constraint }],
                    });
                    break;
                default:
                    break;
            }
            return;
        }

        if (data.type === errorCodes.templateValidationError || data.type === 'FilterValidationError') {
            getValidationErrorEntities(error as AxiosError, failedEntities, originalEntity);
            return;
        }
    } else if ((error as IBrokenRulesError).metadata?.errorCode === errorCodes.ruleBlock) {
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
            entities: [
                {
                    properties,
                },
            ],
        });

        return;
    }

    failedEntities.push({
        properties,
        errors: [{ type: ActionErrors.validation, metadata: error.metadata }],
    });
};
