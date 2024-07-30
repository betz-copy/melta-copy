import { Request } from 'express';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import groupBy from 'lodash.groupby';
import { RelationshipsTemplateManagerService } from '../../externalServices/templates/relationshipTemplateManager';
import EntityManager from '../entities/manager';
import { ValidationError } from '../error';
import { ActionTypes, IAction, ICreateEntityMetadata, ICreateRelationshipMetadata } from '../relationships/interfaces/action';
import { EntityTemplateManagerService } from '../../externalServices/templates/entityTemplateManager';
import { IMongoRelationshipTemplate } from '../../externalServices/templates/interfaces/relationshipTemplates';
import { IEntity } from '../entities/interface';
import { IMongoEntityTemplate } from '../../externalServices/templates/interfaces/entityTemplates';

const ajv = new Ajv();

ajv.addFormat('fileId', /.*/);
ajv.addFormat('text-area', /.*/);
ajv.addFormat('relationshipReference', /.*/);
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);
ajv.addKeyword({
    keyword: 'dateNotification',
    type: 'number',
});
ajv.addKeyword({ keyword: 'calculateTime', type: 'boolean' });
ajv.addKeyword({ keyword: 'isDailyAlert', type: 'boolean' });
ajv.addKeyword({
    keyword: 'serialStarter',
    type: 'number',
});
ajv.addKeyword({
    keyword: 'relationshipReference',
    type: 'string',
});
ajv.addKeyword({
    keyword: 'serialCurrent',
    type: 'number',
});

const validateRelationship = (relationshipTemplate: IMongoRelationshipTemplate, sourceEntity: IEntity, destinationEntity: IEntity) => {
    if (!relationshipTemplate) {
        throw new ValidationError(`Relationship template doesnt exist`);
    }

    if (
        relationshipTemplate.destinationEntityId !== destinationEntity.templateId ||
        relationshipTemplate.sourceEntityId !== sourceEntity.templateId
    ) {
        throw new ValidationError(`Relationship template source/destination id does not match entity source/destination id.`);
    }
};

const validateEntity = async (entityTemplate: IMongoEntityTemplate, metadataProperties: Record<string, any>) => {
    if (!entityTemplate) {
        throw new ValidationError(`Entity template doesnt exist`);
    }

    const validateFunction = ajv.compile(entityTemplate.properties);
    const valid = validateFunction(metadataProperties);

    if (!valid) {
        throw new ValidationError(`Entity does not match template schema: ${JSON.stringify(validateFunction.errors)}`);
    }
};

export const validateActionsGroups = async (req: Request) => {
    const { actionsGroups } = req.body;

    const entitiesIds = new Set<string>();
    const relationshipTemplatesIds = new Set<string>();
    const entityTemplatesIds = new Set<string>();

    (actionsGroups as IAction[][]).forEach((actionsGroup) =>
        actionsGroup.forEach((action) => {
            if (action.actionType === ActionTypes.CreateRelationship) {
                const metadata = action.actionMetadata as ICreateRelationshipMetadata;

                entitiesIds.add(metadata.destinationEntityId);
                entitiesIds.add(metadata.sourceEntityId);
                relationshipTemplatesIds.add(metadata.relationshipTemplateId);
            } else if (action.actionType === ActionTypes.CreateEntity) {
                const metadata = action.actionMetadata as ICreateEntityMetadata;

                entityTemplatesIds.add(metadata.templateId);
            }
        }),
    );

    const [entities, relationshipTemplates, entitiesTemplates] = await Promise.all([
        EntityManager.getEntitiesByIds([...entitiesIds]),
        RelationshipsTemplateManagerService.searchRelationshipTemplates({ ids: [...relationshipTemplatesIds] }),
        EntityTemplateManagerService.searchEntityTemplates({ ids: [...entityTemplatesIds] }),
    ]).catch(() => {
        throw new ValidationError(`General error finding Relationship or Entity`);
    });

    console.log({ entities, relationshipTemplates, entitiesTemplates });

    const entitiesByEntitiesIds = groupBy(entities, (entity) => entity.properties._id);
    const relationshipTemplatesByRelationshipTemplatesIds = groupBy(relationshipTemplates, (relationshipTemplate) => relationshipTemplate._id);
    const entitiesTemplatesByEntitiesTemplatesIds = groupBy(entitiesTemplates, (entityTemplate) => entityTemplate._id);

    (actionsGroups as IAction[][]).forEach((actionsGroup) =>
        actionsGroup.forEach((action) => {
            if (action.actionType === ActionTypes.CreateRelationship) {
                const metadata = action.actionMetadata as ICreateRelationshipMetadata;

                if (
                    !metadata.relationshipTemplateId.startsWith('$') &&
                    !metadata.sourceEntityId.startsWith('$') &&
                    !metadata.destinationEntityId.startsWith('$')
                ) {
                    validateRelationship(
                        relationshipTemplatesByRelationshipTemplatesIds[metadata.relationshipTemplateId][0],
                        entitiesByEntitiesIds[metadata.sourceEntityId][0],
                        entitiesByEntitiesIds[metadata.destinationEntityId][0],
                    );
                }
            } else if (action.actionType === ActionTypes.CreateEntity) {
                const metadata = action.actionMetadata as ICreateEntityMetadata;

                if (!metadata.templateId.startsWith('$')) {
                    validateEntity(entitiesTemplatesByEntitiesTemplatesIds[metadata.templateId][0], metadata.properties);
                }
            }
        }),
    );
};
