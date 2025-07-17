import { Request } from 'express';
import * as ts from 'typescript-actions';
import {
    addPropertyToRequest,
    DefaultController,
    IMongoEntityTemplate,
    IEntitySingleProperty,
    BadRequestError,
    EntityTemplateType,
    TemplateItem,
    IMongoEntityTemplatePopulated,
} from '@microservices/shared';
import { generateInterfaceWithRelationships } from '../../utils/entityTemplateActions/interfacesGenerator';
import EntityTemplateManager from './manager';
import { compileTsCode } from '../../utils/entityTemplateActions/tsCompiler';

class EntityTemplateValidator extends DefaultController<IMongoEntityTemplate, EntityTemplateManager> {
    constructor(workspaceId: string) {
        super(new EntityTemplateManager(workspaceId));
    }

    getAllRelationshipReferencesEntityTemplates = async (templateId: string) => {
        const entityTemplates = await this.manager.getTemplates({ limit: 0, skip: 0 });
        const templatesMap = new Map(entityTemplates.map((template) => [template._id, template]));
        const baseTemplate = templatesMap.get(templateId)!;
        const entityPropertiesQueue = [baseTemplate.properties.properties];
        const relationshipReferenceIdsMap = new Map<string, TemplateItem>([
            [templateId, { type: EntityTemplateType.Parent, metaData: baseTemplate as IMongoEntityTemplatePopulated }],
        ]);

        while (entityPropertiesQueue.length > 0) {
            const currentEntityProperties = entityPropertiesQueue.shift()!;

            Object.values(currentEntityProperties).forEach((propertyValues) => {
                if (propertyValues.format === 'relationshipReference') {
                    const { relatedTemplateId = '' } = propertyValues.relationshipReference!;

                    if (!relationshipReferenceIdsMap.has(relatedTemplateId)) {
                        const relatedTemplate = templatesMap.get(relatedTemplateId)!;
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

    private validateProperties(properties: Record<string, IEntitySingleProperty>) {
        const relatedUserFieldsOfkartoffelFields: string[] = [];
        const userFields: string[] = [];
        Object.entries(properties).forEach(([key, value]) => {
            if (value.format && value.format === 'user') {
                userFields.push(key);
            }
            if (value.format && value.format === 'kartoffelUserField') {
                relatedUserFieldsOfkartoffelFields.push(value.expandedUserField?.relatedUserField || '');
                if (!value.expandedUserField?.relatedUserField)
                    throw new BadRequestError('kartoffelField derived from user field that does not exist');

                const relateUserField = properties[value.expandedUserField?.relatedUserField];

                if (relateUserField && relateUserField.archive && !value.archive)
                    throw new BadRequestError('Cannot archive user field that have unarchived kartoffelField');
            }
        });

        if (relatedUserFieldsOfkartoffelFields.some((userField) => !userFields.includes(userField)))
            throw new BadRequestError('Cannot add kartoffelField derived from user field that does not exist');
    }

    validateEntityTemplateUpdate = async (req: Request) => {
        const {
            body: { actions, properties },
            params: { templateId },
        } = req;

        if (actions) {
            const { actions: existingActions } = await this.manager.getTemplateById(templateId);

            if (actions !== existingActions) throw new BadRequestError('Cannot update actions in update entityTemplate request');
        }

        this.validateProperties(properties.properties);
    };

    validateCreateEntityTemplate = async (req: Request) => {
        const {
            body: { properties },
        } = req;

        this.validateProperties(properties.properties);
    };
}

export default EntityTemplateValidator;
