import * as ts from 'typescript-actions';
import * as vm from 'vm';
import { Transaction } from 'neo4j-driver';
import format from 'date-fns/format';
import { isDate } from 'date-fns';
import { IEntity, IEntityCrudAction, IExecutionOutput, isIEntity } from '../../express/entities/interface';
import { ServiceError } from '../../express/error';
import { validateEntity } from '../../express/entities/validator.template';
import EntityManager from '../../express/entities/manager';
import { IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';
import config from '../../config';
import { generateInterfaceWithRelationships } from './interfaceGenerator';

const { brokenRulesFakeEntityIdPrefix, errorCodes } = config;

const getPopulatedRelationshipReferencesFields = (entity: IEntity) => {
    const populatedInstances = EntityManager.fixReturnedEntityReferencesFields(entity);

    Object.entries(populatedInstances.properties).forEach(([name, value]) => {
        if (isIEntity(value)) {
            populatedInstances.properties[name] = value.properties;
        }
    });

    return populatedInstances;
};

const generateFakeEntityId = (index: number) => {
    return `${brokenRulesFakeEntityIdPrefix}${index}._id`;
};

const addDefaultFunctionsToActionCode = (
    entityTemplate: IMongoEntityTemplate,
    crudAction: IEntityCrudAction,
    entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
) => {
    const defaultCode = `class CustomError extends Error {
           constructor(message: string) {
               super(message);
               this.name = ${errorCodes.actionsCustomError};
            }
        }
        ${generateInterfaceWithRelationships(entitiesTemplatesByIds)}
        const actions: any[] = [];
        function updateEntity(entityId: string, properties: Record<string, any>): void {
          actions.push({ entityId, properties });
        }`;

    const getActionsFunction = `function getActions(${entityTemplate.name}:${entityTemplate.name}){
          ${crudAction}(${entityTemplate.name})
            return actions
        }`;

    const code = `${defaultCode}\n${entityTemplate.actions}\n${getActionsFunction}`;
    const jsCode = ts.transpile(code);

    return jsCode;
};

const executeActionCodeInVM = (entity: IEntity, jsCode: string) => {
    try {
        const context = vm.createContext({ entity: entity.properties });

        // define timeout in order to prevent collapse of the system in case of infinite loop for example: while(true){}
        vm.runInContext(jsCode, context, { timeout: 10000 });

        const executionOutput: IExecutionOutput[] = vm.runInContext('getActions(entity)', context);
        return executionOutput;
    } catch (error) {
        if ((error as Error).name === errorCodes.actionsCustomError)
            throw new ServiceError(400, `Error executing VM code of actions`, {
                errorCode: errorCodes.actionsCustomError,
                message: (error as Error).message,
            });

        throw new ServiceError(400, `Error executing VM code  of actions: ${error}`);
    }
};

const adjustExecutionOutputToCommonStructure = async (
    executionOutput: IExecutionOutput[],
    entity: IEntity,
    crudAction: IEntityCrudAction,
    transaction: Transaction,
    entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
) => {
    const updatedEntities: IExecutionOutput[] = [];

    await Promise.all(
        executionOutput.map(async (entityToUpdate) => {
            if (entityToUpdate.entityId === undefined) {
                throw new ServiceError(400, 'cant create new entity by code');
            }

            const currentEntity = await EntityManager.getEntityByIdInTransaction(entityToUpdate.entityId, transaction);
            const currentEntityTemplate = entitiesTemplatesByIds.get(currentEntity.templateId)!;
            const entityAfterManipulations = entityToUpdate;

            if (entityToUpdate.entityId === entity.properties._id && crudAction === IEntityCrudAction.onCreateEntity) {
                entityAfterManipulations.entityId = generateFakeEntityId(0);
            }

            Object.entries(currentEntityTemplate.properties.properties).forEach(([name, value]) => {
                if (name in entityToUpdate.properties) {
                    const propertyValue = entityToUpdate.properties[name];

                    if (value.format === 'relationshipReference') {
                        entityAfterManipulations.properties[name] = propertyValue._id;
                    }
                    if (value.format === 'date-time' && isDate(propertyValue)) {
                        entityAfterManipulations.properties[name] = propertyValue.toISOString();
                    }
                    if (value.format === 'date' && isDate(propertyValue)) {
                        entityAfterManipulations.properties[name] = format(propertyValue, 'yyyy-MM-dd');
                    }
                    if (value.serialCurrent && value.serialCurrent - 1 !== propertyValue) {
                        throw new ServiceError(400, "can't change serial number properties");
                    }
                }
            });

            await validateEntity(currentEntityTemplate, entityAfterManipulations.properties);

            updatedEntities.push(entityAfterManipulations);
        }),
    );

    return updatedEntities;
};

export const executeActionCodeAndGetEntitiesToUpdate = async (
    entityTemplate: IMongoEntityTemplate,
    entity: IEntity,
    crudAction: IEntityCrudAction,
    transaction: Transaction,
    entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
): Promise<IExecutionOutput[]> => {
    const populatedInstances = getPopulatedRelationshipReferencesFields(entity);
    const jsCode = addDefaultFunctionsToActionCode(entityTemplate, crudAction, entitiesTemplatesByIds);

    const executionOutput = executeActionCodeInVM(populatedInstances, jsCode);

    const updatedEntities = await adjustExecutionOutputToCommonStructure(executionOutput, entity, crudAction, transaction, entitiesTemplatesByIds);

    return updatedEntities;
};
