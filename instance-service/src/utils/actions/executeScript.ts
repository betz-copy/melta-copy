import * as ts from 'typescript';
import * as vm from 'vm';
import { Transaction } from 'neo4j-driver';
import { IMongoEntityTemplate } from '../../externalServices/entityTemplateManager';
import { generateInterface } from './generateInterfaceFromJsonSchema';
import { IEntity } from '../../express/entities/interface';
import { ServiceError } from '../../express/error';
import { validateEntity } from '../../express/entities/validator.template';
import EntityManager from '../../express/entities/manager';
import { IBrokenRule } from '../../express/rules/interfaces';

const prepareCodeForActionExecution = (entityTemplate: IMongoEntityTemplate, crudAction: 'onCreateEntity' | 'onUpdateEntity' | 'onDeleteEntity') => {
    const updateEntityFunction = [
        `${generateInterface(entityTemplate.properties.properties, entityTemplate.name)}`,
        'const actions: any[] = [];',
        'function updateEntity(entityId: string, properties: Record<string, any>): void {',
        '  actions.push({ entityId, properties });',
        '}',
    ].join('\n');

    const getActionsFunction = [
        `function getActions(${entityTemplate.name}:${entityTemplate.name}){`,
        `  ${crudAction}(${entityTemplate.name}:${entityTemplate.name})`,
        '    return actions',
        '}',
    ].join('\n');

    const code = `${updateEntityFunction}\n${entityTemplate.actions}\n${getActionsFunction}`;
    const jsCode = ts.transpile(code);

    return jsCode;
};

const executeActionCodeInVM = (entity: IEntity, jsCode: string) => {
    try {
        const context = vm.createContext({ entity: entity.properties });
        // define timeout in order to prevent collapse of the system in case of infinite loop for example: while(true){}
        vm.runInContext(jsCode, context, { timeout: 10000 });
        const executionOutput: { entityId: string; properties: Record<string, any> }[] = vm.runInContext('getActions(entity)', context);
        return executionOutput;
    } catch (error) {
        throw new ServiceError(400, `Error executing VM code: ${error}`);
    }
};

export const executeActionAndUpdateRelevantEntities = async (
    entityTemplate: IMongoEntityTemplate,
    entity: IEntity,
    crudAction: 'onCreateEntity' | 'onUpdateEntity' | 'onDeleteEntity',
    transaction: Transaction,
    ignoredRules: IBrokenRule[],
): Promise<IEntity[]> => {
    const jsCode = prepareCodeForActionExecution(entityTemplate, crudAction);
    const executionOutput: { entityId: string; properties: Record<string, any> }[] = executeActionCodeInVM(entity, jsCode);
    const updatedEntities: IEntity[] = [];

    await Promise.all(
        executionOutput.map(async (entityToUpdate) => {
            if (entityToUpdate.entityId === undefined) {
                throw new ServiceError(400, 'cant create new entity by code');
            }

            await validateEntity(entityTemplate._id, entityToUpdate.properties);

            const updatedEntity = await EntityManager.updateEntityByIdInnerTrans(
                entityToUpdate.entityId,
                entityToUpdate.properties,
                entityTemplate,
                ignoredRules,
                transaction,
            );

            updatedEntities.push(updatedEntity);
        }),
    );

    return updatedEntities;
};
