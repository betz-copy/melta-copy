/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import { Box, Collapse, Grid, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import isEqual from 'lodash.isequal';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import {
    ActionTypes,
    IActionPopulated,
    ICreateEntityMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDuplicateEntityMetadataPopulated,
    IUpdateEntityMetadataPopulated,
} from '../../../interfaces/ruleBreaches/actionMetadata';
import {
    IBrokenRulePopulated,
    ICausesOfInstancePopulated,
    IEntityForBrokenRules,
    IRelationshipForBrokenRules,
} from '../../../interfaces/ruleBreaches/ruleBreach';
import { IMongoRule } from '../../../interfaces/rules';
import { RuleIcon } from './RuleIcon';
import { MeltaTooltip } from '../../MeltaTooltip';
import { EntityInfo } from '../InstanceInfo/EntityInfo';
import { RelationshipInfo } from '../InstanceInfo/RelationshipInfo';
import { IEntity } from '../../../interfaces/entities';
import { environment } from '../../../globals';
import { BrokenRuleActions } from './BrokenRuleActions';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { IRelationshipPopulated } from '../../../interfaces/relationships';

export const BrokenRuleFull: React.FC<{
    brokenRule: IBrokenRulePopulated;
    ruleTemplate: IMongoRule;
    actions: IActionPopulated[];
}> = ({ brokenRule, ruleTemplate, actions }) => {
    const [openRule, setOpenRule] = useState(false);
    const queryClient = useQueryClient();

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const entityTemplate = entityTemplates.get(ruleTemplate.entityTemplateId)!;

    const getActionsByFailureOnEntity = (failure: { entity: IEntityForBrokenRules; causes: ICausesOfInstancePopulated[] }) => {
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

    const getActionsByFailureOnRelationship = (failure: { entity: IEntityForBrokenRules; causes: ICausesOfInstancePopulated[] }) => {
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

    const getEntityForEntityInfo = (entity: IEntity | string | null): IEntity | null => {
        if (!entity) {
            return null;
        }
        if (typeof entity === 'string' && entity.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
            // The id structure is '$numberPart._id' so the slice(1,-4) is in order to cut the '$' in the beginning,
            // and the '._id' in the end
            const numberPart = entity.slice(1, -4);
            const actionIndex = Number(numberPart) < actions.length ? Number(numberPart) : 0;
            const { templateId, properties } = actions[actionIndex].actionMetadata as
                | ICreateEntityMetadataPopulated
                | IDuplicateEntityMetadataPopulated;

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
        const updatedProperties = actions.reduce((previousUpdatedProperties, currentAction) => {
            if (
                currentAction.actionType === ActionTypes.UpdateEntity &&
                (currentAction.actionMetadata as IUpdateEntityMetadataPopulated).entity?.properties._id === (entity as IEntity).properties._id
            ) {
                return {
                    ...previousUpdatedProperties,
                    ...(currentAction.actionMetadata as IUpdateEntityMetadataPopulated).updatedFields,
                };
            }
            return previousUpdatedProperties;
        }, (entity as IEntity).properties);

        return {
            templateId: (entity as IEntity).templateId,
            properties: updatedProperties,
        };
    };

    const getEntityForRelationshipInfo = (entity: IEntity | string | null): IMongoEntityTemplatePopulated => {
        if (!entity || (typeof entity === 'string' && !entity.startsWith(environment.brokenRulesFakeEntityIdPrefix))) {
            return {
                _id: 'empty',
                properties: {
                    hide: [],
                    properties: {},
                    required: [],
                    type: 'object',
                },
                category: { _id: 'empty', color: 'empty', displayName: 'empty', name: 'empty' },
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
            const { templateId, properties } = actions[actionIndex].actionMetadata as
                | ICreateEntityMetadataPopulated
                | IDuplicateEntityMetadataPopulated;

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

    const getRelationshipForRelationshipInfo = (relationship: IRelationshipForBrokenRules) => {
        let relationshipTemplateId: string | null = null;

        if (!relationship) return null;

        if (typeof relationship === 'string' && relationship.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
            // The id structure is '$numberPart._id' so the slice(1,-4) is in order to cut the '$' in the beginning,
            // and the '._id' in the end
            const numberPart = relationship.slice(1, -4);
            const actionIndex = Number(numberPart) < actions.length ? Number(numberPart) : 0;

            const actionMetadata: ICreateRelationshipMetadataPopulated = actions[actionIndex]
                .actionMetadata as unknown as ICreateRelationshipMetadataPopulated;

            relationshipTemplateId = actionMetadata.relationshipTemplateId;

            const relationshipTemplate = relationshipTemplates.get(relationshipTemplateId)!;

            return {
                _id: 'temp',
                sourceEntity: getEntityForRelationshipInfo(actionMetadata.sourceEntity),
                destinationEntity: getEntityForRelationshipInfo(actionMetadata.destinationEntity),
                name: relationshipTemplate.name,
                displayName: relationshipTemplate.displayName,
                createdAt: relationshipTemplate.createdAt,
                updatedAt: relationshipTemplate.updatedAt,
            };
        }

        const relationshipTemplate = relationshipTemplates.get((relationship as IRelationshipPopulated).templateId);

        return {
            _id: 'temp',
            sourceEntity: getEntityForRelationshipInfo((relationship as IRelationshipPopulated).sourceEntity),
            destinationEntity: getEntityForRelationshipInfo((relationship as IRelationshipPopulated).destinationEntity),
            name: relationshipTemplate?.name || '',
            displayName: relationshipTemplate?.displayName || '',
            createdAt: relationshipTemplate?.createdAt || '',
            updatedAt: relationshipTemplate?.updatedAt || '',
        };
    };

    return (
        <>
            <ListItemButton onClick={() => setOpenRule((prev) => !prev)}>
                <ListItemIcon>
                    <RuleIcon ruleType={ruleTemplate.actionOnFail} />
                </ListItemIcon>
                <ListItemText secondary={i18next.t('ruleBreachInfo.relevantEntities')}>
                    <MeltaTooltip title={ruleTemplate.description}>
                        <Box component="span" sx={{ fontWeight: 'bold' }}>
                            {ruleTemplate.name}
                        </Box>
                    </MeltaTooltip>
                </ListItemText>
                {openRule ? (
                    <ExpandLessIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                ) : (
                    <ExpandMoreIcon style={{ color: '#787C9E', width: '20px', height: '20px' }} />
                )}
            </ListItemButton>
            <Collapse in={openRule} timeout="auto" unmountOnExit>
                <Grid>
                    <List dense component="div" disablePadding>
                        {brokenRule.failures.map(({ entity, causes }, i) => {
                            const causeOfMainEntityIndex = causes.findIndex(({ instance }) => {
                                const currEntityOfCause = instance.aggregatedRelationship
                                    ? instance.aggregatedRelationship.otherEntity
                                    : instance.entity;
                                return isEqual(currEntityOfCause, entity);
                            });

                            const causesWithoutMainEntity = causes.slice();
                            if (causeOfMainEntityIndex > -1) causesWithoutMainEntity.splice(causeOfMainEntityIndex, 1);

                            return (
                                <Grid key={i}>
                                    <Grid item>
                                        {causesWithoutMainEntity.length === 0 && (
                                            <>
                                                <Grid paddingBottom="10px">
                                                    <Grid style={{ width: 'fit-content', cursor: 'pointer' }}>
                                                        <EntityInfo
                                                            entity={getEntityForEntityInfo(entity)}
                                                            entityTemplate={entityTemplate}
                                                            failedProperties={causes.flatMap((cause) => cause.properties)}
                                                        />
                                                    </Grid>
                                                </Grid>
                                                <BrokenRuleActions
                                                    actions={getActionsByFailureOnEntity({ entity, causes })}
                                                    failedProperties={causes.flatMap((cause) => cause.properties)}
                                                />
                                            </>
                                        )}
                                    </Grid>
                                    <Grid item>
                                        {causesWithoutMainEntity.length > 0 && (
                                            <>
                                                {causesWithoutMainEntity.length > 1 && (
                                                    <Typography paddingLeft="15px">{i18next.t('ruleBreachInfo.relationshipsCombination')}</Typography>
                                                )}
                                                {causesWithoutMainEntity.map(({ instance }, j) => {
                                                    const relationship = instance.aggregatedRelationship
                                                        ? instance.aggregatedRelationship.relationship
                                                        : null;

                                                    return (
                                                        <Grid key={j} paddingBottom="10px">
                                                            <Grid style={{ width: 'fit-content', cursor: 'pointer' }}>
                                                                <RelationshipInfo
                                                                    relationship={getRelationshipForRelationshipInfo(relationship)}
                                                                    failedProperties={causes.flatMap((cause) => cause.properties)}
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    );
                                                })}
                                                <BrokenRuleActions
                                                    actions={getActionsByFailureOnRelationship({ entity, causes })}
                                                    failedProperties={causes.flatMap((cause) => cause.properties)}
                                                />
                                            </>
                                        )}
                                    </Grid>
                                </Grid>
                            );
                        })}
                        {brokenRule.failures.length === 0 && (
                            <ListItemText sx={{ pl: 4 }}>{i18next.t('ruleBreachInfo.noRelevantEntitiesForBrokenRule')}</ListItemText>
                        )}
                    </List>
                </Grid>
            </Collapse>
        </>
    );
};
