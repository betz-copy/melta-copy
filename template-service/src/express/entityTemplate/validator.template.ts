import { Request } from 'express';
import * as ts from 'typescript-actions';
import DefaultController from '../../utils/express/controller';
import { generateInterfaceWithRelationships } from '../../utils/entityTemplateActions/interfacesGenerator';
import { ServiceError } from '../error';
import { IEntityTemplatePopulated, IMongoEntityTemplate } from './interface';
import EntityTemplateManager from './manager';
import { addPropertyToRequest } from '../../utils/express';
import { compileTsCode } from '../../utils/entityTemplateActions/tsCompiler';

export class EntityTemplateValidator extends DefaultController<IMongoEntityTemplate, EntityTemplateManager> {
    constructor(workspaceId: string) {
        super(new EntityTemplateManager(workspaceId));
    }

    private getAllRelationshipReferencesEntityTemplates = async ({ _id, properties: { properties } }: IEntityTemplatePopulated) => {
        const relatedTemplates: Set<string> = new Set<string>();
        relatedTemplates.add(_id);

        Object.values(properties).forEach((value) => {
            if (value.format === 'relationshipReference') relatedTemplates.add(value.relationshipReference?.relatedTemplateId!);
        });

        const entityTemplates = await this.manager.getTemplates({ ids: Array.from(relatedTemplates), limit: 0, skip: 0 });
        return new Map(entityTemplates.map((template) => [template._id, template]));
    };

    private cleanActionCode = (action: string, entitiesTemplatesByIds: Map<string, IMongoEntityTemplate>) => {
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

        const entityTemplate = await this.manager.getTemplateById(templateId);

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

        const entityTemplatesByIds = await this.getAllRelationshipReferencesEntityTemplates(entityTemplate);

        addPropertyToRequest(req, 'actions', this.cleanActionCode(actions, entityTemplatesByIds));
    };

    validateEntityTemplateUpdate = async (req: Request) => {
        const {
            body: { actions },
            params: { templateId },
        } = req;

        if (actions) {
            const { actions: existingActions } = await this.manager.getTemplateById(templateId);

            if (actions !== existingActions) throw new ServiceError(400, 'Cannot update actions in update entityTemplate request');
        }
    };
}
