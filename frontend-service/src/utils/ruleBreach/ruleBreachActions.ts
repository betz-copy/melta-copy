import { isEqual } from 'lodash';
import { environment } from '../../globals';
import { IEntity } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IRelationshipPopulated } from '../../interfaces/relationships';
import { IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import {
    ActionTypes,
    IActionPopulated,
    ICreateEntityMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDuplicateEntityMetadataPopulated,
    IUpdateEntityMetadataPopulated,
} from '../../interfaces/ruleBreaches/actionMetadata';
import { ICausesOfInstancePopulated, IEntityForBrokenRules, IRelationshipForBrokenRules } from '../../interfaces/ruleBreaches/ruleBreach';

export const getActionsByFailureOnEntity = (
    failure: { entity: IEntityForBrokenRules; causes: ICausesOfInstancePopulated[] },
    actions: IActionPopulated[],
) => {
    const actionsToReturn: IActionPopulated[] = [];

    const { entity, causes } = failure;

    const failedEntityId = typeof entity === 'string' ? entity : entity?.properties._id;

    const failedProperties: string[] = causes.flatMap((cause) => cause.properties);

    let numberPart = -1;
    if (typeof entity === 'string' && entity.startsWith('$')) {
        numberPart = parseInt(entity.slice(1, -4), 10);
        actionsToReturn.push(actions[numberPart]);
    }
    actionsToReturn.push(
        ...actions.filter((action, index) => {
            let updatedFieldsToCheckFail: string[] = [];
            let entityId = '-';

            if (numberPart === index) return false;
            if (action.actionType === ActionTypes.CreateEntity) {
                entityId = (action.actionMetadata as ICreateEntityMetadataPopulated).properties._id;

                updatedFieldsToCheckFail = Object.keys((action.actionMetadata as ICreateEntityMetadataPopulated).properties);
            }
            if (action.actionType === ActionTypes.DuplicateEntity) {
                entityId = (action.actionMetadata as IDuplicateEntityMetadataPopulated).properties._id;

                updatedFieldsToCheckFail = Object.keys((action.actionMetadata as IDuplicateEntityMetadataPopulated).properties);
            }
            if (action.actionType === ActionTypes.UpdateEntity) {
                entityId = (action.actionMetadata as IUpdateEntityMetadataPopulated)?.entity?.properties._id || '-';

                updatedFieldsToCheckFail = Object.keys((action.actionMetadata as IUpdateEntityMetadataPopulated).updatedFields);
            }
            return failedEntityId === entityId && updatedFieldsToCheckFail.some((propertyField) => failedProperties.includes(propertyField));
        }),
    );

    return actionsToReturn;
};

export const getActionsByFailureOnRelationship = (
    failure: { entity: IEntityForBrokenRules; causes: ICausesOfInstancePopulated[] },
    actions: IActionPopulated[],
) => {
    const actionsToReturn: IActionPopulated[] = [];

    const { entity, causes } = failure;

    const causeOfMainEntityIndex = causes.findIndex(({ instance }) => {
        const currEntityOfCause = instance.aggregatedRelationship ? instance.aggregatedRelationship.otherEntity : instance.entity;
        return isEqual(currEntityOfCause, entity);
    });

    const causesWithoutMainEntity = causes.slice();
    if (causeOfMainEntityIndex > -1) causesWithoutMainEntity.splice(causeOfMainEntityIndex, 1);

    causesWithoutMainEntity.forEach(({ instance }) => {
        const aggregatedRelationship = instance.aggregatedRelationship ? instance.aggregatedRelationship.relationship : '';

        if (typeof aggregatedRelationship === 'string' && aggregatedRelationship.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
            // The id structure is '$numberPart._id' so the slice(1,-4) is in order to cut the '$' in the beginning,
            // and the '._id' in the end
            const numberPart = aggregatedRelationship.slice(1, -4);
            const actionIndex = Number(numberPart) < actions.length ? Number(numberPart) : 0;
            actionsToReturn.push(actions[actionIndex]);
        }
    });

    return actionsToReturn;
};

export const getEntityForEntityInfo = (entity: IEntity | string | null, actions: IActionPopulated[]): IEntity | null => {
    if (!entity) {
        return null;
    }
    if (typeof entity === 'string' && entity.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
        // The id structure is '$numberPart._id' so the slice(1,-4) is in order to cut the '$' in the beginning,
        // and the '._id' in the end
        const numberPart = entity.slice(1, -4);
        const actionIndex = Number(numberPart) < actions.length ? Number(numberPart) : 0;
        const { templateId, properties } = actions[actionIndex].actionMetadata as ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated;

        let mergedProperties = { ...properties };

        // if the created entity updated by actions- show the updated properties
        actions.forEach((currentAction) => {
            if (
                currentAction.actionType === ActionTypes.UpdateEntity &&
                (currentAction.actionMetadata as IUpdateEntityMetadataPopulated).entity?.properties._id?.startsWith(
                    environment.brokenRulesFakeEntityIdPrefix,
                ) &&
                (currentAction.actionMetadata as IUpdateEntityMetadataPopulated).entity?.properties._id === entity
            ) {
                const { updatedFields } = currentAction.actionMetadata as IUpdateEntityMetadataPopulated;

                mergedProperties = {
                    ...properties,
                    ...updatedFields,
                };
            }
        });

        return {
            templateId,
            properties: {
                // if entity wasn't created yet, put generated properties. if it has, it will override
                _id: entity,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                disabled: false,

                ...mergedProperties,
            },
        };
    }
    // Start by cloning once
    const updatedProperties = { ...(entity as IEntity).properties };

    for (const action of actions) {
        if (
            action.actionType === ActionTypes.UpdateEntity &&
            (action.actionMetadata as IUpdateEntityMetadataPopulated).entity?.properties._id === (entity as IEntity).properties._id
        ) {
            const updatedFields = (action.actionMetadata as IUpdateEntityMetadataPopulated).updatedFields;

            // Merge updatedFields manually
            for (const key in updatedFields) {
                if (Object.hasOwn(updatedFields, key)) updatedProperties[key] = updatedFields[key];
            }
        }
    }

    return {
        templateId: (entity as IEntity).templateId,
        properties: updatedProperties,
    };
};

export const getEntityForRelationshipInfo = (
    entity: IEntity | string | null,
    actions: IActionPopulated[],
    entityTemplates: IEntityTemplateMap,
    entityTemplateId: string = '',
): IMongoEntityTemplatePopulated => {
    if (!entity || (typeof entity === 'string' && !entity.startsWith(environment.brokenRulesFakeEntityIdPrefix))) {
        const entityTemplate = entityTemplates.get(entityTemplateId);

        if (entityTemplate) {
            return {
                ...entityTemplate,
                displayName: `${entityTemplate.displayName} (נמחק)`,
                properties: {
                    hide: [],
                    properties: {},
                    required: [],
                    type: 'object',
                },
            };
        }
        return {
            _id: 'empty',
            properties: {
                hide: [],
                properties: {},
                required: [],
                type: 'object',
            },
            category: { _id: 'empty', color: 'yellow', displayName: 'empty', name: 'empty', templatesOrder: [] },
            disabled: false,
            displayName: '---',
            name: '---',
            propertiesOrder: [],
            propertiesPreview: [],
            propertiesTypeOrder: [],
            uniqueConstraints: [],
        };
    }
    if (typeof entity === 'string' && entity.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
        // The id structure is '$numberPart._id' so the slice(1,-4) is in order to cut the '$' in the beginning,
        // and the '._id' in the end
        const numberPart = entity.slice(1, -4);
        const actionIndex = Number(numberPart) < actions.length ? Number(numberPart) : 0;
        const { templateId, properties } = actions[actionIndex].actionMetadata as ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated;

        let mergedProperties = { ...properties };

        // if the created entity updated by actions- show the updated properties
        actions.forEach((currentAction) => {
            if (
                currentAction.actionType === ActionTypes.UpdateEntity &&
                (currentAction.actionMetadata as IUpdateEntityMetadataPopulated).entity?.properties._id === properties._id
            ) {
                const { updatedFields } = currentAction.actionMetadata as IUpdateEntityMetadataPopulated;

                mergedProperties = {
                    ...properties,
                    ...updatedFields,
                };
            }
        });

        const currEntityTemplate = entityTemplates.get(templateId)!;

        return {
            _id: currEntityTemplate._id,
            properties: {
                hide: [],
                properties: mergedProperties,
                required: [],
                type: 'object',
            },
            category: currEntityTemplate.category,
            disabled: false,
            displayName: currEntityTemplate.displayName,
            name: currEntityTemplate.name,
            propertiesOrder: [],
            propertiesPreview: [],
            propertiesTypeOrder: [],
            uniqueConstraints: [],
        };
    }

    const entityToPopulate: IEntity = entity as IEntity;
    const currEntityTemplate = entityTemplates.get(entityToPopulate.templateId)!;

    return {
        _id: currEntityTemplate._id,
        properties: {
            hide: [],
            properties: entityToPopulate.properties,
            required: [],
            type: 'object',
        },
        category: currEntityTemplate.category,
        disabled: false,
        displayName: currEntityTemplate.displayName,
        name: currEntityTemplate.name,
        propertiesOrder: [],
        propertiesPreview: [],
        propertiesTypeOrder: [],
        uniqueConstraints: [],
    };
};

export const getRelationshipForRelationshipInfo = (
    relationship: IRelationshipForBrokenRules,
    actions: IActionPopulated[],
    entityTemplates: IEntityTemplateMap,
    relationshipTemplates: IRelationshipTemplateMap,
) => {
    let relationshipTemplateId: string | null = null;

    if (!relationship) return null;

    if (typeof relationship === 'string' && relationship.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
        // The id structure is '$numberPart._id' so the slice(1,-4) is in order to cut the '$' in the beginning,
        // and the '._id' in the end
        const numberPart = relationship.slice(1, -4);
        const actionIndex = Number(numberPart) < actions.length ? Number(numberPart) : 0;

        const actionMetadata: ICreateRelationshipMetadataPopulated = actions[actionIndex].actionMetadata as ICreateRelationshipMetadataPopulated;

        relationshipTemplateId = actionMetadata.relationshipTemplateId;

        const relationshipTemplate = relationshipTemplates.get(relationshipTemplateId)!;

        return {
            _id: 'temp',
            sourceEntity: getEntityForRelationshipInfo(actionMetadata.sourceEntity, actions, entityTemplates, relationshipTemplate.sourceEntityId),
            destinationEntity: getEntityForRelationshipInfo(
                actionMetadata.destinationEntity,
                actions,
                entityTemplates,
                relationshipTemplate.destinationEntityId,
            ),
            name: relationshipTemplate.name,
            displayName: relationshipTemplate.displayName,
            createdAt: relationshipTemplate.createdAt,
            updatedAt: relationshipTemplate.updatedAt,
        };
    }

    const relationshipTemplate = relationshipTemplates.get((relationship as IRelationshipPopulated).templateId);

    return {
        _id: 'temp',
        sourceEntity: getEntityForRelationshipInfo(
            (relationship as IRelationshipPopulated).sourceEntity,
            actions,
            entityTemplates,
            relationshipTemplate?.sourceEntityId,
        ),
        destinationEntity: getEntityForRelationshipInfo(
            (relationship as IRelationshipPopulated).destinationEntity,
            actions,
            entityTemplates,
            relationshipTemplate?.destinationEntityId,
        ),
        name: relationshipTemplate?.name || '',
        displayName: relationshipTemplate?.displayName || '',
        createdAt: relationshipTemplate?.createdAt || '',
        updatedAt: relationshipTemplate?.updatedAt || '',
    };
};
