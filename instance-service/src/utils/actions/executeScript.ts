import * as ts from 'typescript';
import * as vm from 'vm';
import { IMongoEntityTemplate } from '../../externalServices/entityTemplateManager';
import { generateInterface } from './generateInterfaceFromJsonSchema';
import { IEntity } from '../../express/entities/interface';

export const executeScript = (
    entityTemplate: IMongoEntityTemplate,
    entity: IEntity,
    crudAction: string,
): { entityId: string; properties: Record<string, any> }[] => {
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

    const context = vm.createContext({
        entity: entity.properties,
    });
    try {
        // define timeout in order to prevent collapse of the system in case of infinite loop for example: while(true){}
        vm.runInContext(jsCode, context, { timeout: 10000 });
        const result: { entityId: string; properties: Record<string, any> }[] = vm.runInContext('getActions(entity)', context);
        return result;
    } catch (error) {
        console.error('Error executing VM code:', error);
    }
    return [];
};
