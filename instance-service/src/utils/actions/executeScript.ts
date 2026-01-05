/* eslint-disable import/prefer-default-export */

import { IChildTemplatePopulated } from '@packages/child-template';
import { IEntity } from '@packages/entity';
import { IMongoEntityTemplate } from '@packages/entity-template';
import { BadRequestError, ValidationError } from '@packages/utils';
import { isDate } from 'date-fns';
import { formatDate } from 'date-fns/format';
import { Transaction } from 'neo4j-driver';
import * as ts from 'typescript-actions';
import * as vm from 'vm';
import config from '../../config';
import { IEntityCrudAction, IExecutionOutput, isRelationshipReference } from '../../express/entities/interface';
import EntityManager from '../../express/entities/manager';
import { EntityValidator } from '../../express/entities/validator.template';
import { generateInterfaceWithRelationships } from './interfaceGenerator';

const { brokenRulesFakeEntityIdPrefix, errorCodes } = config;

const getPopulatedRelationshipReferencesFields = (entity: IEntity) => {
    const manipulatedEntity = JSON.parse(JSON.stringify(entity));

    Object.entries(manipulatedEntity.properties).forEach(([name, value]) => {
        if (isRelationshipReference(value)) manipulatedEntity.properties[name] = value.properties;
    });

    return manipulatedEntity;
};

const generateFakeEntityId = (index: number) => `${brokenRulesFakeEntityIdPrefix}${index}._id`;

const addDefaultFunctionsToActionCode = (
    entityTemplate: IMongoEntityTemplate,
    crudAction: IEntityCrudAction,
    entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
    childTemplate?: IChildTemplatePopulated,
) => {
    const defaultCode = `class CustomError extends Error {
           constructor(message: string) {
               super(message);
               this.name = 'ACTIONS_CUSTOM_ERROR';
            }
        }
        ${generateInterfaceWithRelationships(entitiesTemplatesByIds, entityTemplate, childTemplate)}
        const actions: { entityId: string; properties: Record<string, any> }[] = [];
        function updateEntity(entityId: string, properties: Record<string, any>): void {
          actions.push({ entityId, properties });
        }`;

    const getActionsFunction = `function getActions(${entityTemplate.name}:${entityTemplate.name}){
          ${crudAction}(${entityTemplate.name})
            return actions
        }`;

    const code = `${defaultCode}\n${entityTemplate.actions}\n${getActionsFunction}`;
    return ts.transpile(code);
};

const executeActionCodeInVM = (entity: IEntity, jsCode: string) => {
    try {
        const context = vm.createContext({ entity: entity.properties });
        vm.runInContext(jsCode, context, { timeout: 10000 });

        return vm.runInContext('getActions(entity)', context);
    } catch (error) {
        if ((error as Error).name === errorCodes.actionsCustomError)
            throw new BadRequestError(`Error executing VM code of actions`, {
                errorCode: errorCodes.actionsCustomError,
                message: (error as Error).message,
            });

        throw new ValidationError(`Error executing VM code of actions: ${error}`);
    }
};

const manipulateOnExecutionOutput = async (
    executionOutput: IExecutionOutput[],
    entity: IEntity,
    crudAction: IEntityCrudAction,
    transaction: Transaction,
    entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
    workspaceId: string,
) => {
    const entityManager = new EntityManager(workspaceId);
    const entityValidator = new EntityValidator(workspaceId);
    const updatedEntities: IExecutionOutput[] = [];

    await Promise.all(
        executionOutput.map(async ({ entityId, properties }) => {
            if (!entityId) throw new ValidationError('cant create new entity by code');

            const currentEntity = await entityManager.getEntityByIdInTransaction(entityId, transaction);
            const currentEntityTemplate = entitiesTemplatesByIds.get(currentEntity.templateId)!;
            const entityAfterManipulations = JSON.parse(JSON.stringify({ entityId, properties }));

            if (entityId === entity.properties._id && crudAction === IEntityCrudAction.onCreateEntity)
                entityAfterManipulations.entityId = generateFakeEntityId(0);

            Object.entries(currentEntityTemplate.properties.properties).forEach(([name, value]) => {
                if (!(name in properties)) return;

                const propertyValue = properties[name];

                if (value.format === 'relationshipReference')
                    entityAfterManipulations.properties[name] =
                        typeof propertyValue === 'object' && propertyValue._id ? propertyValue._id : currentEntity.properties[name].properties._id;

                if (value.format === 'date-time' && isDate(propertyValue)) entityAfterManipulations.properties[name] = propertyValue.toISOString();

                if (value.format === 'date' && isDate(propertyValue))
                    entityAfterManipulations.properties[name] = formatDate(propertyValue, 'yyyy-MM-dd');

                if (value.serialCurrent && currentEntity.properties[name] !== propertyValue)
                    throw new ValidationError("can't change serial number properties");

                if (value.format === 'location') entityAfterManipulations.properties[name] = JSON.stringify(propertyValue);
            });

            entityValidator.validateEntity(currentEntityTemplate, entityAfterManipulations.properties);

            updatedEntities.push(entityAfterManipulations);
        }),
    );

    return updatedEntities;
};

export const executeActionCodeAndGetEntitiesToUpdate = (
    entityTemplate: IMongoEntityTemplate,
    entity: IEntity,
    crudAction: IEntityCrudAction,
    transaction: Transaction,
    entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>,
    workspaceId: string,
    childTemplate?: IChildTemplatePopulated,
): Promise<IExecutionOutput[]> => {
    const fixedEntity = getPopulatedRelationshipReferencesFields(entity);
    const jsCode = addDefaultFunctionsToActionCode(entityTemplate, crudAction, entitiesTemplatesByIds, childTemplate);

    const executionOutput = executeActionCodeInVM(fixedEntity, jsCode);

    return manipulateOnExecutionOutput(executionOutput, entity, crudAction, transaction, entitiesTemplatesByIds, workspaceId);
};
