import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { Request } from 'express';
import groupBy from 'lodash.groupby';
import {
    IMongoEntityTemplate,
    IMongoRelationshipTemplate,
    ActionTypes,
    ICreateEntityMetadata,
    ICreateRelationshipMetadata,
    IAction,
    IEntity,
    ActionErrors,
    ValidationError,
    CoordinateSystem,
} from '@microservices/shared';
import EntityTemplateManagerService from '../../externalServices/templates/entityTemplateManager';
import RelationshipsTemplateManagerService from '../../externalServices/templates/relationshipTemplateManager';
import DefaultController from '../../utils/express/controller';
import EntityManager from '../entities/manager';
import config from '../../config';

const { brokenRulesFakeEntityIdPrefix } = config;

const ajv = new Ajv({ allErrors: true });

ajv.addFormat('fileId', /.*/);
ajv.addFormat('signature', /.*/);
ajv.addFormat('comment', /.*/);
ajv.addFormat('kartoffelUserField', /.*/);
ajv.addFormat('unitField', /.*/);
ajv.addFormat('user', {
    type: 'string',
    validate: (user) => {
        const userObj = JSON.parse(user);
        return userObj._id && userObj.fullName && userObj.jobTitle && userObj.hierarchy && userObj.mail;
    },
});
ajv.addFormat('text-area', /.*/);
ajv.addFormat('relationshipReference', /.*/);
ajv.addFormat('location', {
    type: 'string',
    validate: (location) => {
        const locationObj = JSON.parse(location);
        return (
            locationObj.location && (locationObj.coordinateSystem === CoordinateSystem.UTM || locationObj.coordinateSystem === CoordinateSystem.WGS84)
        );
    },
});
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);
ajv.addKeyword({
    keyword: 'dateNotification',
    type: 'number',
});
ajv.addKeyword({ keyword: 'calculateTime', type: 'boolean' });
ajv.addKeyword({ keyword: 'isDailyAlert', type: 'boolean' });
ajv.addKeyword({ keyword: 'isDatePastAlert', type: 'boolean' });
ajv.addKeyword({ keyword: 'archive', type: 'boolean' });
ajv.addKeyword({ keyword: 'identifier', type: 'boolean' });
ajv.addKeyword({ keyword: 'hideFromDetailsPage', type: 'boolean' });
ajv.addKeyword({ keyword: 'comment', type: 'string' });
ajv.addKeyword({ keyword: 'color', type: 'string' });
ajv.addKeyword({
    keyword: 'serialStarter',
    type: 'number',
});
ajv.addKeyword({ keyword: 'user', type: 'string' });
ajv.addKeyword({ keyword: 'expandedUserField', type: 'string' });
ajv.addKeyword({
    keyword: 'relationshipReference',
    type: 'string',
});
ajv.addKeyword({
    keyword: 'serialCurrent',
    type: 'number',
});

class BulkActionValidator extends DefaultController {
    private entityManager: EntityManager;

    private relationshipsTemplateManagerService: RelationshipsTemplateManagerService;

    private entityTemplateManagerService: EntityTemplateManagerService;

    constructor(workspaceId: string) {
        super(undefined);
        this.entityManager = new EntityManager(workspaceId);
        this.relationshipsTemplateManagerService = new RelationshipsTemplateManagerService(workspaceId);
        this.entityTemplateManagerService = new EntityTemplateManagerService(workspaceId);
    }

    private validateRelationship(relationshipTemplate: IMongoRelationshipTemplate, sourceEntity: IEntity, destinationEntity: IEntity) {
        if (!relationshipTemplate) {
            throw new ValidationError(`Relationship template doesnt exist`);
        }

        if (
            relationshipTemplate.destinationEntityId !== destinationEntity.templateId ||
            relationshipTemplate.sourceEntityId !== sourceEntity.templateId
        ) {
            throw new ValidationError(`Relationship template source/destination id does not match entity source/destination id.`);
        }
    }

    private validateEntity(entityTemplate: IMongoEntityTemplate, metadataProperties: Record<string, any>) {
        if (!entityTemplate) {
            throw new ValidationError(`Entity template doesnt exist`, metadataProperties);
        }

        const validateFunction = ajv.compile(entityTemplate.properties);
        const valid = validateFunction(metadataProperties);

        if (!valid) {
            const errors = validateFunction.errors?.map((error) => ({
                type: ActionErrors.validation,
                metadata: {
                    message: error.message,
                    path: error.instancePath,
                    schemaPath: error.schemaPath,
                    params: error.params,
                },
            }));

            throw new ValidationError(`Entity does not match template schema`, {
                properties: metadataProperties,
                errors: errors || [],
            });
        }
    }

    async validateActionsGroups(req: Request) {
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
            this.entityManager.getEntitiesByIds([...entitiesIds]),
            this.relationshipsTemplateManagerService.searchRelationshipTemplates({ ids: [...relationshipTemplatesIds] }),
            this.entityTemplateManagerService.searchEntityTemplates({ ids: [...entityTemplatesIds] }),
        ]).catch(() => {
            throw new ValidationError(`General error finding Relationship or Entity`);
        });

        const entitiesByEntitiesIds = groupBy(entities, (entity) => entity.properties._id);
        const relationshipTemplatesByRelationshipTemplatesIds = groupBy(relationshipTemplates, (relationshipTemplate) => relationshipTemplate._id);
        const entitiesTemplatesByEntitiesTemplatesIds = groupBy(entitiesTemplates, (entityTemplate) => entityTemplate._id);

        (actionsGroups as IAction[][]).forEach((actionsGroup) =>
            actionsGroup.forEach((action, index) => {
                if (action.actionType === ActionTypes.CreateRelationship) {
                    const metadata = action.actionMetadata as ICreateRelationshipMetadata;

                    if (
                        !metadata.relationshipTemplateId.startsWith(brokenRulesFakeEntityIdPrefix) &&
                        !metadata.sourceEntityId.startsWith(brokenRulesFakeEntityIdPrefix) &&
                        !metadata.destinationEntityId.startsWith(brokenRulesFakeEntityIdPrefix)
                    ) {
                        this.validateRelationship(
                            relationshipTemplatesByRelationshipTemplatesIds[metadata.relationshipTemplateId][0],
                            entitiesByEntitiesIds[metadata.sourceEntityId][0],
                            entitiesByEntitiesIds[metadata.destinationEntityId][0],
                        );
                    }
                } else if (action.actionType === ActionTypes.CreateEntity) {
                    const metadata = action.actionMetadata as ICreateEntityMetadata;

                    if (!metadata.templateId.startsWith(brokenRulesFakeEntityIdPrefix)) {
                        this.validateEntity(entitiesTemplatesByEntitiesTemplatesIds[metadata.templateId][0], { ...metadata.properties, index });
                    }
                }
            }),
        );
    }
}

export default BulkActionValidator;
