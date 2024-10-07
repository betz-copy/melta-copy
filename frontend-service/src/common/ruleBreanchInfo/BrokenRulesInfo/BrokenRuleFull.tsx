/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import { Box, Collapse, Grid, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import isEqual from 'lodash.isequal';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import {
    ActionTypes,
    IActionPopulated,
    ICreateEntityMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadataPopulated,
    IDuplicateEntityMetadataPopulated,
    IUpdateEntityMetadataPopulated,
} from '../../../interfaces/ruleBreaches/actionMetadata';
import { IBrokenRulePopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { IMongoRule } from '../../../interfaces/rules';
import { RuleIcon } from './RuleIcon';
import { MeltaTooltip } from '../../MeltaTooltip';
import { EntityInfo } from '../InstanceInfo/EntityInfo';
import { RelationshipInfo } from '../InstanceInfo/RelationshipInfo';
import { IEntity } from '../../../interfaces/entities';
import { environment } from '../../../globals';
import { BrokenRuleActions } from './BrokenRuleActions';

export const BrokenRuleFull: React.FC<{
    brokenRule: IBrokenRulePopulated;
    ruleTemplate: IMongoRule;
    actions: IActionPopulated[];
}> = ({ brokenRule, ruleTemplate, actions }) => {
    const [openRule, setOpenRule] = useState(false);
    const queryClient = useQueryClient();

    console.log({ brokenRule });

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const entityTemplate = entityTemplates.get(ruleTemplate.entityTemplateId)!;

    let actionsToReturn: IActionPopulated[] = [];

    brokenRule.failures.forEach(({ entity, causes }, i) => {
        const causeOfMainEntityIndex = causes.findIndex(({ instance }) => {
            const currEntityOfCause = instance.aggregatedRelationship ? instance.aggregatedRelationship.otherEntity : instance.entity;
            return isEqual(currEntityOfCause, entity);
        });

        const causesWithoutMainEntity = causes.slice();
        if (causeOfMainEntityIndex > -1) causesWithoutMainEntity.splice(causeOfMainEntityIndex, 1);

        if (causesWithoutMainEntity.length === 0) {
            // broken rule on entity
            console.log({ brokenRuleEnt: brokenRule, entity, actions });
            if (typeof entity === 'string' && entity.startsWith('$')) {
                const numberPart = parseInt(entity.slice(1, -4), 10);
                actionsToReturn.push(actions[numberPart]);
            } else {
                actionsToReturn = actions.filter((action) => {
                    if (action.actionType === ActionTypes.CreateEntity) {
                        const entityId = (action.actionMetadata as ICreateEntityMetadataPopulated).properties._id;

                        if (typeof entity === 'string') return entity === entityId;
                        return entity?.properties._id === entityId;
                    }
                    if (action.actionType === ActionTypes.DuplicateEntity) {
                        const entityId = (action.actionMetadata as IDuplicateEntityMetadataPopulated).properties._id;

                        if (typeof entity === 'string') return entity === entityId;
                        return entity?.properties._id === entityId;
                    }
                    if (action.actionType === ActionTypes.UpdateEntity) {
                        const entityId = (action.actionMetadata as IUpdateEntityMetadataPopulated)?.entity?.properties._id;

                        if (typeof entity === 'string') return entity === entityId;
                        return entity?.properties._id === entityId;
                    }
                    return false;
                });
            }
        } else {
            // broken rule on relationship
            console.log({ brokenRuleRel: brokenRule });
            causesWithoutMainEntity.forEach(({ instance }) => {
                const entityToShow = (instance.aggregatedRelationship ? instance.aggregatedRelationship.otherEntity : instance.entity) as IEntity; // because we excluded causeOfMainEntity from causes

                actionsToReturn.push(
                    ...actions.filter((action) => {
                        let sourceEntity: string | IEntity | null = null;
                        let destEntity: string | IEntity | null = null;
                        const entityId = typeof entity === 'string' ? entity : entity?.properties._id;

                        if (action.actionType === ActionTypes.CreateRelationship) {
                            sourceEntity = (action.actionMetadata as ICreateRelationshipMetadataPopulated).sourceEntity;
                            destEntity = (action.actionMetadata as ICreateRelationshipMetadataPopulated).destinationEntity;
                        }
                        if (action.actionType === ActionTypes.DeleteRelationship) {
                            sourceEntity = (action.actionMetadata as IDeleteRelationshipMetadataPopulated).sourceEntity;
                            destEntity = (action.actionMetadata as IDeleteRelationshipMetadataPopulated).destinationEntity;
                        }

                        const sourceEntityId =
                            !sourceEntity || typeof sourceEntity === 'string' ? sourceEntity : (sourceEntity as IEntity).properties._id;
                        const destEntityId = !destEntity || typeof destEntity === 'string' ? destEntity : (destEntity as IEntity).properties._id;

                        return (
                            (entityId === sourceEntityId && entityToShow.properties._id === destEntity) ||
                            (entityId === destEntityId && entityToShow.properties._id === sourceEntityId)
                        );
                    }),
                );
            });
        }
    });

    // TODO - filter here the actions of every broken rule HERE!!!

    console.log({ brokenRule });

    // const getActionsOfEntityFailure = (entity: IEntityForBrokenRules, isRelationship: boolean): IActionPopulated[] => {
    //     return actions.filter((action) => {
    //         if (isRelationship) {
    //             if (action.actionType === ActionTypes.CreateRelationship)
    //                 return (
    //                     (action.actionMetadata as unknown as ICreateRelationshipMetadata).sourceEntityId === entity ||
    //                     (action.actionMetadata as unknown as ICreateRelationshipMetadata).destinationEntityId === entity
    //                 );
    //         }

    //         return false;
    //     });
    // };

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
                    (currentAction.actionMetadata as IUpdateEntityMetadataPopulated).entity?.properties._id === properties._id
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

    // const getRelationshipForRelationshipInfo = () => {
    //     let rel: IMongoRelationshipTemplatePopulated | null = null;
    // };

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
                            const causeOfMainEntity = causes[causeOfMainEntityIndex];

                            const causesWithoutMainEntity = causes.slice();
                            if (causeOfMainEntityIndex > -1) causesWithoutMainEntity.splice(causeOfMainEntityIndex, 1);

                            const mainEntityPropertiesToShowTooltipOverride = [
                                ...(causeOfMainEntity?.properties || []),
                                ...(entityTemplate?.propertiesPreview || []),
                            ];

                            console.log({ causesWithoutMainEntity });

                            return (
                                <Grid key={i}>
                                    {/* <ListItem key={i}>
                                        {'- '}
                                        <ListItemText sx={{ pl: 4 }}>
                                            <EntityForBrokenRules
                                                ruleTemplate={ruleTemplate}
                                                entity={entity}
                                                entityTemplate={entityTemplate}
                                                actions={actions}
                                                entityPropertiesToShowTooltipOverride={[...new Set(mainEntityPropertiesToShowTooltipOverride)]}
                                                entityPropertiesToHighlightTooltip={causeOfMainEntity?.properties}
                                            />
                                            {causesWithoutMainEntity.length > 0 && ': '}
                                            {causesWithoutMainEntity.map(({ instance, properties }, j) => {
                                                const entityToShow = (
                                                    instance.aggregatedRelationship ? instance.aggregatedRelationship.otherEntity : instance.entity
                                                ) as IEntity; // because we excluded causeOfMainEntity from causes

                                                const entityTemplateOfEntityToShow =
                                                    // eslint-disable-next-line no-nested-ternary
                                                    !entityToShow ? null : entityTemplates.get(entityToShow.templateId)!;

                                                const entityPropertiesToShowTooltipOverride = [
                                                    ...properties,
                                                    ...(entityTemplateOfEntityToShow?.propertiesPreview || []),
                                                ];

                                                return (
                                                    <>
                                                        {j > 0 && ', '}
                                                        <EntityForBrokenRules
                                                            // eslint-disable-next-line react/no-array-index-key
                                                            key={j}
                                                            ruleTemplate={ruleTemplate}
                                                            entity={entityToShow}
                                                            entityTemplate={entityTemplateOfEntityToShow}
                                                            actions={actions}
                                                            entityPropertiesToShowTooltipOverride={[
                                                                ...new Set(entityPropertiesToShowTooltipOverride),
                                                            ]}
                                                            entityPropertiesToHighlightTooltip={properties}
                                                        />
                                                    </>
                                                );
                                            })}
                                        </ListItemText>
                                    </ListItem> */}
                                    <Grid item>
                                        {causesWithoutMainEntity.length === 0 && (
                                            <Grid paddingBottom="10px">
                                                <Grid style={{ width: 'fit-content', cursor: 'pointer' }}>
                                                    <EntityInfo
                                                        entity={getEntityForEntityInfo(entity)}
                                                        entityTemplate={entityTemplate}
                                                        actions={actions}
                                                    />
                                                </Grid>
                                            </Grid>
                                        )}
                                    </Grid>
                                    <Grid item>
                                        {causesWithoutMainEntity.length > 0 && (
                                            <Typography paddingLeft="15px">{i18next.t('ruleBreachInfo.relationshipsCombination')}</Typography>
                                        )}
                                        {causesWithoutMainEntity.length > 0 &&
                                            causesWithoutMainEntity.map(({ instance }, j) => {
                                                const relationship = instance.aggregatedRelationship
                                                    ? instance.aggregatedRelationship.relationship
                                                    : null;

                                                console.log({ relationship });
                                                return (
                                                    <Grid key={j} paddingBottom="10px">
                                                        <Grid style={{ width: 'fit-content', cursor: 'pointer' }}>
                                                            <RelationshipInfo actions={actions} relationship={relationship} />
                                                        </Grid>
                                                    </Grid>
                                                );
                                            })}
                                    </Grid>
                                    {actionsToReturn.length > 0 && <BrokenRuleActions actions={actionsToReturn} />}
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
