import { Box, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties, ReactNode } from 'react';
import { useQueryClient } from 'react-query';
import { environment } from '../../globals';
import { IEntity } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import {
    ActionTypes,
    IActionMetadataPopulated,
    IActionPopulated,
    ICreateEntityMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadataPopulated,
    IDuplicateEntityMetadataPopulated,
    IUpdateEntityMetadataPopulated,
    IUpdateEntityStatusMetadataPopulated,
} from '../../interfaces/ruleBreaches/actionMetadata';
import { IEntityForBrokenRules } from '../../interfaces/ruleBreaches/ruleBreach';
import { ActionOnFail, IMongoRule } from '../../interfaces/rules';
import { IUser } from '../../interfaces/users';
import { useUserStore } from '../../stores/user';
import { getAllAllowedEntities, getAllAllowedRelationships } from '../../utils/permissions/templatePermissions';
import { populateRelationshipTemplate } from '../../utils/templates';
import { EntityLink, EntityLinkProps } from '../EntityLink';
import { EntityPropertiesInternal } from '../EntityProperties';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import { UpdatedFieldsDiff } from './UpdatedFieldsDiff';

interface EntityInfoProps {
    entity: IEntity | string | null;
    entityTemplate: IMongoEntityTemplatePopulated | null;
    actions: IActionPopulated[];
    entityPropertiesToShowTooltipOverride?: string[];
    entityPropertiesToHighlightTooltip?: string[];
    entityPropertiesToHighlightColor?: CSSProperties['color'];
}

export const EntityInfo: React.FC<EntityInfoProps> = ({
    entity,
    entityTemplate,
    actions,
    entityPropertiesToShowTooltipOverride,
    entityPropertiesToHighlightTooltip,
    entityPropertiesToHighlightColor,
}) => {
    let entityForLink: IEntity | null;
    let tooltipHeader: ReactNode | undefined;
    let linkable = true;

    if (!entity) {
        entityForLink = null;
        linkable = false;
    } else if (typeof entity === 'string' && entity.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
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

        entityForLink = {
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

        tooltipHeader = (
            <Typography variant="body2" fontStyle="italic">
                {entityForLink.properties._id.startsWith(environment.brokenRulesFakeEntityIdPrefix)
                    ? i18next.t('ruleBreachInfo.theEntityThatIsSupposedToBeCreated')
                    : i18next.t('ruleBreachInfo.theEntityThatWasCreated')}
            </Typography>
        );
        linkable = !entityForLink.properties._id.startsWith(environment.brokenRulesFakeEntityIdPrefix);
    } else {
        const updatedProperties = actions.reduce(
            (previousUpdatedProperties, currentAction) => {
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
            },
            (entity as IEntity).properties,
        );

        entityForLink = {
            templateId: (entity as IEntity).templateId,
            properties: updatedProperties,
        };
    }

    return (
        <EntityLink
            entity={entityForLink}
            entityTemplate={entityTemplate}
            entityPropertiesToShowTooltipOverride={entityPropertiesToShowTooltipOverride}
            entityPropertiesToHighlightTooltip={entityPropertiesToHighlightTooltip}
            entityPropertiesToHighlightColor={entityPropertiesToHighlightColor}
            tooltipHeader={tooltipHeader}
            linkable={linkable}
        />
    );
};

export const EntityForBrokenRules: React.FC<{
    ruleTemplate: IMongoRule;
    entity: IEntityForBrokenRules;
    entityTemplate: IMongoEntityTemplatePopulated | null;
    actions: IActionPopulated[];
    entityPropertiesToShowTooltipOverride?: string[];
    entityPropertiesToHighlightTooltip?: string[];
}> = ({ ruleTemplate, entity, entityTemplate, actions, entityPropertiesToShowTooltipOverride, entityPropertiesToHighlightTooltip }) => {
    const theme = useTheme();

    return (
        <EntityInfo
            entity={entity}
            entityTemplate={entityTemplate}
            actions={actions}
            entityPropertiesToShowTooltipOverride={entityPropertiesToShowTooltipOverride}
            entityPropertiesToHighlightTooltip={entityPropertiesToHighlightTooltip}
            entityPropertiesToHighlightColor={
                ruleTemplate.actionOnFail === ActionOnFail.WARNING ? theme.palette.warning.main : theme.palette.error.main
            }
        />
    );
};

export const RelationshipInfo: React.FC<{
    relationshipTemplatePopulated: IMongoRelationshipTemplatePopulated;
    sourceEntity: IEntity | string | null;
    destinationEntity: IEntity | string | null;
    actions: IActionPopulated[];
    failedProperties: string[];
}> = ({ relationshipTemplatePopulated, sourceEntity, destinationEntity, actions, failedProperties }) => {
    return (
        <>
            <Box component="span">{i18next.t('ruleBreachInfo.relActionInfo.relationship')}</Box>{' '}
            <Box component="span" sx={{ fontWeight: 'bold' }}>
                {relationshipTemplatePopulated.displayName}
            </Box>{' '}
            <Box component="span">{i18next.t('ruleBreachInfo.relActionInfo.fromEntity')}</Box>{' '}
            <EntityInfo
                entity={sourceEntity}
                entityTemplate={relationshipTemplatePopulated.sourceEntity}
                actions={actions}
                entityPropertiesToHighlightTooltip={failedProperties}
                entityPropertiesToHighlightColor="red"
            />{' '}
            <Box component="span">{i18next.t('ruleBreachInfo.relActionInfo.toEntity')}</Box>{' '}
            <EntityInfo
                entity={destinationEntity}
                entityTemplate={relationshipTemplatePopulated.destinationEntity}
                actions={actions}
                entityPropertiesToHighlightTooltip={failedProperties}
                entityPropertiesToHighlightColor="red"
            />
        </>
    );
};

const CreateOrDeleteRelActionInfo: React.FC<{
    actionType: ActionTypes.CreateRelationship | ActionTypes.DeleteRelationship;
    actionMetadata: ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated;
    actions: IActionPopulated[];
    failedProperties: string[];
}> = ({ actionType, actionMetadata, actions, failedProperties }) => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const { sourceEntity, destinationEntity, relationshipTemplateId } = actionMetadata;

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const allowedEntityTemplates: IMongoEntityTemplatePopulated[] = getAllAllowedEntities(Array.from(entityTemplates.values()), currentUser);
    const allowedEntityTemplatesIds: string[] = allowedEntityTemplates.map((entity) => entity._id);
    const allowedRelationships = getAllAllowedRelationships(Array.from(relationshipTemplates.values()), allowedEntityTemplatesIds);

    const relationshipTemplate = allowedRelationships.find((relationship) => relationship._id === relationshipTemplateId)!;
    const relationshipTemplatePopulated = populateRelationshipTemplate(relationshipTemplate, entityTemplates);

    return (
        <Typography component="p" variant="body1">
            <Box component="span">{`${i18next.t(`ruleBreachInfo.relActionInfo.${actionType}`)} `}</Box>
            <RelationshipInfo
                relationshipTemplatePopulated={relationshipTemplatePopulated}
                sourceEntity={sourceEntity}
                destinationEntity={destinationEntity}
                actions={actions}
                failedProperties={failedProperties}
            />
        </Typography>
    );
};

const EntityInstanceLink: React.FC<EntityLinkProps> = ({
    entity,
    entityTemplate,
    entityPropertiesToHighlightTooltip,
    linkable,
    entityPropertiesToHighlightColor = 'red',
}) => {
    return (
        <>
            {entityTemplate ? (
                <EntityLink
                    entity={entity}
                    entityTemplate={entityTemplate}
                    entityPropertiesToHighlightColor={entityPropertiesToHighlightColor}
                    entityPropertiesToHighlightTooltip={entityPropertiesToHighlightTooltip}
                    linkable={linkable}
                />
            ) : (
                <MeltaTooltip title={i18next.t('notifications.noPermissionsToTemplate')}>
                    <Typography display="inline" fontWeight="bold">
                        {i18next.t('ruleBreachInfo.updateEntityActionInfo.unknownEntity')}
                    </Typography>
                </MeltaTooltip>
            )}{' '}
        </>
    );
};

const CreateOrDuplicateEntityActionInfo: React.FC<{
    actionType: ActionTypes.CreateEntity | ActionTypes.DuplicateEntity;
    actionMetadata: ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated;
    isCompact: boolean;
    actionIndex: number;
    failedProperties: string[];
}> = ({ actionType, actionMetadata, isCompact, actionIndex, failedProperties }) => {
    const queryClient = useQueryClient();

    const { templateId, properties } = actionMetadata;

    const entity: IEntity = {
        templateId,
        properties: {
            // if entity wasnt created yet, put generated properties. if it has, it will override
            _id: `$${actionIndex}._id`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            disabled: false,

            ...properties,
        },
    };

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = entityTemplates.get(templateId);

    return (
        <Grid container direction="column">
            <Grid>
                <Typography component="p" variant="body1">
                    <Box component="span">
                        {actionType === ActionTypes.CreateEntity && i18next.t('ruleBreachInfo.createOrDuplicateEntityActionInfo.creatingEntity')}
                        {actionType === ActionTypes.DuplicateEntity &&
                            i18next.t('ruleBreachInfo.createOrDuplicateEntityActionInfo.duplicatingEntity')}
                    </Box>{' '}
                    <EntityInstanceLink
                        entity={entity}
                        entityTemplate={entityTemplate || null}
                        linkable={entity.properties._id ? !entity.properties._id.startsWith(environment.brokenRulesFakeEntityIdPrefix) : false}
                        entityPropertiesToHighlightTooltip={failedProperties}
                    />
                    {!isCompact ? ':' : ''}
                </Typography>
            </Grid>
            {!isCompact && entityTemplate && (
                <Grid alignItems="center" alignSelf="center" border="1px solid" padding="10px" borderRadius="5px">
                    <EntityPropertiesInternal
                        properties={entity.properties}
                        coloredFields={entity.coloredFields}
                        entityTemplate={entityTemplate}
                        mode="normal"
                    />
                </Grid>
            )}
        </Grid>
    );
};

const UpdateEntityActionInfo: React.FC<{
    actionMetadata: IUpdateEntityMetadataPopulated;
    isCompact: boolean;
    failedProperties: string[];
}> = ({ actionMetadata, isCompact, failedProperties }) => {
    const queryClient = useQueryClient();

    const { entity } = actionMetadata;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = !entity ? entityTemplates.get(actionMetadata.updatedFields.templateId) : entityTemplates.get(entity.templateId);

    const { templateId, ...restFields } = actionMetadata.updatedFields;
    // TODO get properties of causes

    return (
        <Grid container direction="column">
            <Grid>
                <Typography component="p" variant="body1">
                    <Box component="span">{i18next.t('ruleBreachInfo.updateEntityActionInfo.updatingEntity')}</Box>{' '}
                    <EntityInstanceLink
                        entityPropertiesToHighlightTooltip={failedProperties}
                        entity={entity ? { ...(entity as IEntity), properties: { ...(entity as IEntity).properties, ...restFields } } : null}
                        entityTemplate={entityTemplate || null}
                        linkable={!!entity?.properties._id && !entity?.properties._id.startsWith(environment.brokenRulesFakeEntityIdPrefix)}
                    />
                    {!isCompact && entityTemplate ? ':' : ''}
                </Typography>
            </Grid>
            {!isCompact && entityTemplate && (
                <Grid marginTop="5px" border={1} padding="5px" borderRadius="5px">
                    <UpdatedFieldsDiff entityTemplate={entityTemplate} actionMetadata={actionMetadata} />
                </Grid>
            )}
        </Grid>
    );
};

const UpdateEntityStatusActionInfo: React.FC<{
    actionMetadata: IUpdateEntityStatusMetadataPopulated;
    failedProperties: string[];
}> = ({ actionMetadata, failedProperties }) => {
    const queryClient = useQueryClient();

    const { entity, disabled } = actionMetadata;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = !entity ? null : entityTemplates.get(entity.templateId);
    return (
        <Typography component="p" variant="body1">
            <Box component="span">{i18next.t('ruleBreachInfo.updateEntityStatusActionInfo.updatingStatus')}</Box>{' '}
            <EntityInstanceLink
                entity={entity}
                entityTemplate={entityTemplate || null}
                entityPropertiesToHighlightTooltip={failedProperties}
                linkable={!!entity?.properties._id && !entity?.properties._id.startsWith(environment.brokenRulesFakeEntityIdPrefix)}
            />
            <Box component="span" fontWeight="bold">
                {disabled
                    ? i18next.t('ruleBreachInfo.updateEntityStatusActionInfo.toDisabled')
                    : i18next.t('ruleBreachInfo.updateEntityStatusActionInfo.toActive')}
            </Box>{' '}
        </Typography>
    );
};

export const ActionInfo: React.FC<{
    originUser?: IUser;
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
    isCompact: boolean;
    actionIndex: number;
    actions: IActionPopulated[];
    failedProperties?: string[];
}> = ({ originUser, actionType, actionMetadata, isCompact, actionIndex, actions, failedProperties = [] }) => {
    return (
        <Grid container flexDirection="column">
            <Grid>
                {(actionType === ActionTypes.CreateRelationship || actionType === ActionTypes.DeleteRelationship) && (
                    <CreateOrDeleteRelActionInfo
                        actionType={actionType}
                        actionMetadata={actionMetadata as ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated}
                        actions={actions}
                        failedProperties={failedProperties}
                    />
                )}
                {(actionType === ActionTypes.CreateEntity || actionType === ActionTypes.DuplicateEntity) && (
                    <CreateOrDuplicateEntityActionInfo
                        actionType={actionType}
                        actionMetadata={actionMetadata as ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated}
                        isCompact={isCompact}
                        actionIndex={actionIndex}
                        failedProperties={failedProperties}
                    />
                )}
                {actionType === ActionTypes.UpdateEntity && (
                    <UpdateEntityActionInfo
                        actionMetadata={actionMetadata as IUpdateEntityMetadataPopulated}
                        isCompact={isCompact}
                        failedProperties={failedProperties}
                    />
                )}
                {actionType === ActionTypes.UpdateStatus && (
                    <UpdateEntityStatusActionInfo
                        actionMetadata={actionMetadata as IUpdateEntityStatusMetadataPopulated}
                        failedProperties={failedProperties}
                    />
                )}
            </Grid>
            {originUser && (
                <Grid marginLeft="4px">
                    <Box component="span">{i18next.t('ruleBreachAlertNotification.by')}</Box>{' '}
                    <Box component="span" fontWeight="bold">
                        {originUser.fullName}
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};
