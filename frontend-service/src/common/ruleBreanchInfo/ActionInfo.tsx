import React, { CSSProperties, ReactNode } from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
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
import { populateRelationshipTemplate } from '../../utils/templates';
import { UpdatedFieldsDiff } from './UpdatedFieldsDiff';
import { IUser } from '../../services/kartoffelService';
import { EntityLink } from '../EntityLink';
import { IEntityForBrokenRules } from '../../interfaces/ruleBreaches/ruleBreach';
import { IMongoRule } from '../../interfaces/rules';
import { EntityPropertiesInternal } from '../EntityProperties';
import { environment } from '../../globals';

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
    } else if (typeof entity === 'string' && entity.startsWith(environment.brokenRulesFakeEntityIdPrefix)) {
        // The id structure is '$numberPart._id' so the slice(1,-4) is in order to cut the '$' in the beginning,
        // and the '._id' in the end
        const numberPart = entity.slice(1, -4);
        const actionIndex = Number(numberPart) < actions.length ? Number(numberPart) : 0;
        const { templateId, properties } = actions[actionIndex].actionMetadata as ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated;
        // todo: when a created entity was updated by actions so see who has the updated field and send it as the broken field to highlight it

        // actions.map((action) => {
        //     if (
        //         action.actionType === ActionTypes.UpdateEntity &&
        //         (action.actionMetadata as IUpdateEntityMetadataPopulated).updatedFields._id.startsWith(environment.brokenRulesFakeEntityIdPrefix)
        //     ) {
        //         const numberPart = entity.slice(1, -4);
        //         const ii = Number(numberPart) < actions.length ? Number(numberPart) : 0;
        //         if (ii === actionIndex) {
        //         }
        //     }
        // });
        entityForLink = {
            templateId,
            properties: {
                // if entity wasn't created yet, put generated properties. if it has, it will override
                _id: entity,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                disabled: false,

                ...properties,
            },
        };

        tooltipHeader = (
            <Typography variant="body2" fontStyle="italic">
                {entityForLink.properties._id.startsWith('&')
                    ? i18next.t('ruleBreachInfo.theEntityThatIsSupposedToBeCreated')
                    : i18next.t('ruleBreachInfo.theEntityThatWasCreated')}
            </Typography>
        );
        linkable = entityForLink.properties._id.startsWith('&');
    } else {
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
            entityPropertiesToHighlightColor={ruleTemplate.actionOnFail === 'WARNING' ? theme.palette.warning.main : theme.palette.error.main}
        />
    );
};

export const RelationshipInfo: React.FC<{
    relationshipTemplatePopulated: IMongoRelationshipTemplatePopulated;
    sourceEntity: IEntity | string | null;
    destinationEntity: IEntity | string | null;
    actions: IActionPopulated[];
}> = ({ relationshipTemplatePopulated, sourceEntity, destinationEntity, actions }) => {
    return (
        <>
            <Box component="span">{i18next.t('ruleBreachInfo.relActionInfo.relationship')}</Box>{' '}
            <Box component="span" sx={{ fontWeight: 'bold' }}>
                {relationshipTemplatePopulated.displayName}
            </Box>{' '}
            <Box component="span">{i18next.t('ruleBreachInfo.relActionInfo.fromEntity')}</Box>{' '}
            <EntityInfo entity={sourceEntity} entityTemplate={relationshipTemplatePopulated.sourceEntity} actions={actions} />{' '}
            <Box component="span">{i18next.t('ruleBreachInfo.relActionInfo.toEntity')}</Box>{' '}
            <EntityInfo entity={destinationEntity} entityTemplate={relationshipTemplatePopulated.destinationEntity} actions={actions} />
        </>
    );
};

const CreateOrDeleteRelActionInfo: React.FC<{
    actionType: ActionTypes.CreateRelationship | ActionTypes.DeleteRelationship;
    actionMetadata: ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated;
    actions: IActionPopulated[];
}> = ({ actionType, actionMetadata, actions }) => {
    const queryClient = useQueryClient();

    const { sourceEntity, destinationEntity, relationshipTemplateId } = actionMetadata;

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const relationshipTemplate = relationshipTemplates.get(relationshipTemplateId)!;
    const relationshipTemplatePopulated = populateRelationshipTemplate(relationshipTemplate, entityTemplates);

    return (
        <Typography component="p" variant="body1">
            <Box component="span">
                {actionType === ActionTypes.CreateRelationship && i18next.t('ruleBreachInfo.relActionInfo.creation')}
                {actionType === ActionTypes.DeleteRelationship && i18next.t('ruleBreachInfo.relActionInfo.deletion')}
            </Box>
            <RelationshipInfo
                relationshipTemplatePopulated={relationshipTemplatePopulated}
                sourceEntity={sourceEntity}
                destinationEntity={destinationEntity}
                actions={actions}
            />
        </Typography>
    );
};

const CreateOrDuplicateEntityActionInfo: React.FC<{
    actionType: ActionTypes.CreateEntity | ActionTypes.DuplicateEntity;
    actionMetadata: ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated;
    isCompact: boolean;
    actionIndex: number;
}> = ({ actionType, actionMetadata, isCompact, actionIndex }) => {
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
    const entityTemplate = entityTemplates.get(templateId)!;

    return (
        <Grid container direction="column">
            <Grid item>
                <Typography component="p" variant="body1">
                    <Box component="span">
                        {actionType === ActionTypes.CreateEntity && i18next.t('ruleBreachInfo.createOrDuplicateEntityActionInfo.creatingEntity')}
                        {actionType === ActionTypes.DuplicateEntity &&
                            i18next.t('ruleBreachInfo.createOrDuplicateEntityActionInfo.duplicatingEntity')}
                    </Box>{' '}
                    <EntityLink entity={entity} entityTemplate={entityTemplate} linkable={!entity.properties._id.startsWith('$')} />
                    {!isCompact ? ':' : ''}
                </Typography>
            </Grid>
            {!isCompact && (
                <Grid item alignItems="center" alignSelf="center" border="1px solid" padding="10px" borderRadius="5px">
                    <EntityPropertiesInternal properties={entity.properties} entityTemplate={entityTemplate} mode="normal" />
                </Grid>
            )}
        </Grid>
    );
};

const UpdateEntityActionInfo: React.FC<{
    actionMetadata: IUpdateEntityMetadataPopulated;
    isCompact: boolean;
}> = ({ actionMetadata, isCompact }) => {
    const queryClient = useQueryClient();

    const { entity } = actionMetadata;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = !entity ? null : entityTemplates.get(entity.templateId)!;

    return (
        <Grid container direction="column">
            <Grid item>
                <Typography component="p" variant="body1">
                    <Box component="span">{i18next.t('ruleBreachInfo.updateEntityActionInfo.updatingEntity')}</Box>{' '}
                    <EntityLink entity={entity} entityTemplate={entityTemplate} linkable={entity!.properties._id !== undefined} />
                    {!isCompact ? ':' : ''}
                </Typography>
            </Grid>
            {!isCompact && (
                <Grid item marginTop="5px" border={1} padding="5px" borderRadius="5px">
                    <UpdatedFieldsDiff entityTemplate={entityTemplate} actionMetadata={actionMetadata} />
                </Grid>
            )}
        </Grid>
    );
};

const UpdateEntityStatusActionInfo: React.FC<{
    actionMetadata: IUpdateEntityStatusMetadataPopulated;
}> = ({ actionMetadata }) => {
    const queryClient = useQueryClient();

    const { entity, disabled } = actionMetadata;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const entityTemplate = !entity ? null : entityTemplates.get(entity.templateId)!;
    return (
        <Typography component="p" variant="body1">
            <Box component="span">{i18next.t('ruleBreachInfo.updateEntityStatusActionInfo.updatingStatus')}</Box>{' '}
            <EntityLink entity={entity} entityTemplate={entityTemplate} />{' '}
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
}> = ({ originUser, actionType, actionMetadata, isCompact, actionIndex, actions }) => {
    return (
        <Grid container flexDirection="column">
            <Grid item>
                {(actionType === ActionTypes.CreateRelationship || actionType === ActionTypes.DeleteRelationship) && (
                    <CreateOrDeleteRelActionInfo
                        actionType={actionType}
                        actionMetadata={actionMetadata as ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated}
                        actions={actions}
                    />
                )}
                {(actionType === ActionTypes.CreateEntity || actionType === ActionTypes.DuplicateEntity) && (
                    <CreateOrDuplicateEntityActionInfo
                        actionType={actionType}
                        actionMetadata={actionMetadata as ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated}
                        isCompact={isCompact}
                        actionIndex={actionIndex}
                    />
                )}
                {actionType === ActionTypes.UpdateEntity && (
                    <UpdateEntityActionInfo actionMetadata={actionMetadata as IUpdateEntityMetadataPopulated} isCompact={isCompact} />
                )}
                {actionType === ActionTypes.UpdateStatus && (
                    <UpdateEntityStatusActionInfo actionMetadata={actionMetadata as IUpdateEntityStatusMetadataPopulated} />
                )}
            </Grid>
            {originUser && (
                <Grid item marginLeft="4px">
                    <Box component="span">{i18next.t('ruleBreachAlertNotification.by')}</Box>{' '}
                    <Box component="span" fontWeight="bold">
                        {originUser.fullName}
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};
