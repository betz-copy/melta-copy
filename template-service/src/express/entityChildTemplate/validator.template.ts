import { Request } from 'express';
import * as ts from 'typescript-actions';
import { addPropertyToRequest, DefaultController, EntityTemplateType, IMongoEntityChildTemplate, TemplateItem } from '@microservices/shared';
import getFullChildTemplateProperties from '../../utils/entityChildTemplate';
import { generateInterfaceWithRelationships } from '../../utils/entityTemplateActions/interfacesGenerator';
import { compileTsCode } from '../../utils/entityTemplateActions/tsCompiler';
import EntityChildTemplateManager from './manager';
import EntityTemplateManager from '../entityTemplate/manager';

class EntityChildTemplateValidator extends DefaultController<IMongoEntityChildTemplate, EntityChildTemplateManager> {
    private entityTemplateManager: EntityTemplateManager;

    constructor(workspaceId: string) {
        super(new EntityChildTemplateManager(workspaceId));
        this.entityTemplateManager = new EntityTemplateManager(workspaceId);
    }

    getAllRelationshipReferencesEntityTemplates = async (templateId: string) => {
        const entityChildTemplates = await this.manager.getChildTemplates({ limit: 0, skip: 0 });
        const childTemplatesMap = new Map(entityChildTemplates.map((template) => [template._id, template]));
        const baseChildTemplate = childTemplatesMap.get(templateId)!;

        const entityParentTemplates = await this.entityTemplateManager.getTemplates({ limit: 0, skip: 0 });
        const parentTemplatesMap = new Map(entityParentTemplates.map((template) => [template._id, template]));
        const baseParentTemplate = parentTemplatesMap.get(baseChildTemplate.fatherTemplateId._id)!;

        const entityProperties = getFullChildTemplateProperties(baseChildTemplate, baseParentTemplate);
        const entityPropertiesQueue = [entityProperties];
        const relationshipReferenceIdsMap = new Map<string, TemplateItem>([
            [templateId, { type: EntityTemplateType.Child, metaData: { ...baseChildTemplate, properties: entityProperties } }],
        ]);

        while (entityPropertiesQueue.length > 0) {
            const currentEntityProperties = entityPropertiesQueue.shift()!;

            Object.values(currentEntityProperties).forEach((propertyValues) => {
                if (propertyValues.format === 'relationshipReference') {
                    const { relatedTemplateId = '' } = propertyValues.relationshipReference!;

                    if (!relationshipReferenceIdsMap.has(relatedTemplateId)) {
                        const relatedTemplate = parentTemplatesMap.get(relatedTemplateId)!;
                        relationshipReferenceIdsMap.set(relatedTemplateId, { type: EntityTemplateType.Parent, metaData: relatedTemplate });

                        entityPropertiesQueue.push(relatedTemplate.properties.properties);
                    }
                }
            });
        }

        return relationshipReferenceIdsMap;
    };

    private cleanActionCode = (action: string, entitiesTemplatesByIds: Map<string, TemplateItem>) => {
        const defaultCode = [
            '/// To throw a custom error in your code, use the following syntax:',
            '// throw new CustomError("Your error message")',
            '',
            `${generateInterfaceWithRelationships(entitiesTemplatesByIds)}`,
            '',
            'function updateEntity(entityId: string, properties: Record<string, any>): void {',
            '  // updates entity in data base',
            '}',
        ].join('\n');

        return action.slice(defaultCode.length + 1);
    };

    validateActionCode = async (req: Request) => {
        const {
            body: { actions },
            params: { templateId },
        } = req;

        const filename = 'ast.ts';
        const customErrorCode = [
            'class CustomError extends Error {',
            '   constructor(message: string) {',
            '       super(message);',
            '       this.name = "CustomError";',
            '    }',
            '}',
        ].join('\n');

        const code = `${customErrorCode}\n${actions}`;

        const sourceFile = ts.createSourceFile(filename, code, ts.ScriptTarget.ES5);

        compileTsCode(filename, sourceFile);

        // todo: ensure that the code doesn't use in global variables
        const entityTemplatesByIds = await this.getAllRelationshipReferencesEntityTemplates(templateId);

        addPropertyToRequest(req, 'actions', this.cleanActionCode(actions, entityTemplatesByIds));
    };
}

export default EntityChildTemplateValidator;
