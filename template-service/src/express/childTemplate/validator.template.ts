
import { EntityTemplateType, getChildPropertiesFiltered, IMongoChildTemplate, TemplateItem } from '@packages/child-template';
import { IMongoEntityTemplatePopulated } from '@packages/entity-template';
import { addPropertyToRequest, DefaultController } from '@packages/utils';
import { Request } from 'express';
import * as ts from 'typescript-actions';
import { generateInterfaceWithRelationships } from '../../utils/entityTemplateActions/interfacesGenerator';
import { compileTsCode } from '../../utils/entityTemplateActions/tsCompiler';
import EntityTemplateManager from '../entityTemplate/manager';
import ChildTemplateManager from './manager';

class ChildTemplateValidator extends DefaultController<IMongoChildTemplate, ChildTemplateManager> {
    private entityTemplateManager: EntityTemplateManager;

    constructor(workspaceId: string) {
        super(new ChildTemplateManager(workspaceId));
        this.entityTemplateManager = new EntityTemplateManager(workspaceId);
    }

    getAllRelationshipReferencesEntityTemplates = async (templateId: string) => {
        const childTemplates = await this.manager.searchChildTemplates({ limit: 0, skip: 0 });
        const childTemplatesMap = new Map(childTemplates.map((template) => [template._id, template]));
        const baseChildTemplate = childTemplatesMap.get(templateId)!;

        const entityParentTemplates = await this.entityTemplateManager.getTemplates({ limit: 0, skip: 0 });
        const parentTemplatesMap = new Map(entityParentTemplates.map((template) => [template._id, template]));

        const entityProperties = getChildPropertiesFiltered(baseChildTemplate.properties.properties);
        const entityPropertiesQueue = [entityProperties];
        const relationshipReferenceIdsMap = new Map<string, TemplateItem>([
            [templateId, { type: EntityTemplateType.Child, metaData: baseChildTemplate }],
        ]);

        while (entityPropertiesQueue.length) {
            const currentEntityProperties = entityPropertiesQueue.shift()!;

            Object.values(currentEntityProperties).forEach((propertyValues) => {
                if (propertyValues.format === 'relationshipReference') {
                    const { relatedTemplateId = '' } = propertyValues.relationshipReference!;

                    if (!relationshipReferenceIdsMap.has(relatedTemplateId)) {
                        const relatedTemplate = parentTemplatesMap.get(relatedTemplateId)!;
                        relationshipReferenceIdsMap.set(relatedTemplateId, {
                            type: EntityTemplateType.Parent,
                            metaData: relatedTemplate as IMongoEntityTemplatePopulated,
                        });

                        entityPropertiesQueue.push(relatedTemplate.properties.properties);
                    }
                }
            });
        }

        return relationshipReferenceIdsMap;
    };

    private cleanActionCode = (action: string, entitiesTemplatesByIds: Map<string, TemplateItem>, templateId: string) => {
        const defaultCode = [
            '/// To throw a custom error in your code, use the following syntax:',
            '// throw new CustomError("Your error message")',
            '',
            `${generateInterfaceWithRelationships(templateId, entitiesTemplatesByIds)}`,
            '',
            'function updateEntity(entityId: string, properties: Record<string, any>): void {',
            '  // updates entity in data base',
            '}',
        ].join('\n');

        const lastBraceInDefault = defaultCode.lastIndexOf('}');

        const braceIndex = action.indexOf('}', lastBraceInDefault);

        const startIndex = braceIndex + 2; // Skip } and first \n, keeping the second \n

        return action.slice(startIndex);
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

        addPropertyToRequest(req, 'actions', this.cleanActionCode(actions, entityTemplatesByIds, templateId));
    };
}

export default ChildTemplateValidator;
