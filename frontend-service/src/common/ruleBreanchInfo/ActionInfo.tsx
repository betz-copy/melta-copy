import React, { ReactNode } from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { IEntity } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import {
    ActionTypes,
    IActionMetadataPopulated,
    ICreateEntityMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadataPopulated,
    IDuplicateEntityMetadataPopulated,
    IUpdateEntityMetadataPopulated,
    IUpdateEntityStatusMetadataPopulated,
} from '../../interfaces/ruleBreaches/actionMetadata';
import { populateRelationshipTemplate } from '../../utils/templates';
import { UpdatedFieldsDiff } from './UpdatedFieldsDiff';
import { IUser } from '../../interfaces/users';
import { EntityLink } from '../EntityLink';
import { IEntityForBrokenRules } from '../../interfaces/ruleBreaches/ruleBreach';
import { IMongoRule } from '../../interfaces/rules';
import { EntityPropertiesInternal } from '../EntityProperties';

export const EntityInfo: React.FC<{
    ruleTemplate: IMongoRule;
    entity: IEntityForBrokenRules;
    entityTemplate: IMongoEntityTemplatePopulated | null;
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
    entityPropertiesToShowTooltipOverride?: string[];
    entityPropertiesToHighlightTooltip?: string[];
}> = ({
    ruleTemplate,
    entity,
    entityTemplate,
    actionType,
    actionMetadata,
    entityPropertiesToShowTooltipOverride,
    entityPropertiesToHighlightTooltip,
}) => {
    const theme = useTheme();

    let entityForLink: IEntity | null;
    let tooltipHeader: ReactNode | undefined;
    let linkable = true;

    if (entity === 'created-entity-id') {
        const { templateId, properties } = actionMetadata as ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated;
        entityForLink = {
            templateId,
            properties: {
                // if entity wasnt created yet, put generated properties. if it has, it will override
                _id: 'created-entity-id',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                disabled: false,

                ...properties,
            },
        };

        tooltipHeader = (
            <Typography variant="body2" fontStyle="italic">
                {entityForLink.properties._id === 'created-entity-id'
                    ? i18next.t('ruleBreachInfo.theEntityThatIsSupposedToBeCreated')
                    : i18next.t('ruleBreachInfo.theEntityThatWasCreated')}
            </Typography>
        );
        linkable = entityForLink.properties._id !== 'created-entity-id';
    } else if (
        actionType === ActionTypes.UpdateEntity &&
        (actionMetadata as IUpdateEntityMetadataPopulated).entity?.properties._id === (entity as IEntity).properties._id
    ) {
        const { updatedFields } = actionMetadata as IUpdateEntityMetadataPopulated;

        entityForLink = {
            templateId: (entity as IEntity).templateId,
            properties: {
                ...(entity as IEntity).properties,
                ...updatedFields,
            },
        };
    } else {
        entityForLink = entity as IEntity | null;
    }

    return (
        <EntityLink
            entity={entityForLink}
            entityTemplate={entityTemplate}
            entityPropertiesToShowTooltipOverride={entityPropertiesToShowTooltipOverride}
            entityPropertiesToHighlightTooltip={entityPropertiesToHighlightTooltip}
            entityPropertiesToHighlightColor={ruleTemplate.actionOnFail === 'WARNING' ? theme.palette.warning.main : theme.palette.error.main}
            tooltipHeader={tooltipHeader}
            linkable={linkable}
        />
    );
};

export const RelationshipInfo: React.FC<{
    relationshipTemplatePopulated: IMongoRelationshipTemplatePopulated;
    sourceEntity: IEntity | null;
    destinationEntity: IEntity | null;
}> = ({ relationshipTemplatePopulated, sourceEntity, destinationEntity }) => {
    return (
        <>
            <Box component="span">{i18next.t('ruleBreachInfo.relActionInfo.relationship')}</Box>{' '}
            <Box component="span" sx={{ fontWeight: 'bold' }}>
                {relationshipTemplatePopulated.displayName}
            </Box>{' '}
            <Box component="span">{i18next.t('ruleBreachInfo.relActionInfo.fromEntity')}</Box>{' '}
            <EntityLink entity={sourceEntity} entityTemplate={relationshipTemplatePopulated.sourceEntity} />{' '}
            <Box component="span">{i18next.t('ruleBreachInfo.relActionInfo.toEntity')}</Box>{' '}
            <EntityLink entity={destinationEntity} entityTemplate={relationshipTemplatePopulated.destinationEntity} />
        </>
    );
};

const CreateOrDeleteRelActionInfo: React.FC<{
    actionType: ActionTypes.CreateRelationship | ActionTypes.DeleteRelationship;
    actionMetadata: ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated;
}> = ({ actionType, actionMetadata }) => {
    const queryClient = useQueryClient();

    const { sourceEntity, destinationEntity, relationshipTemplateId } = actionMetadata;

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const relationshipTemplate = relationshipTemplates.get(relationshipTemplateId)!;
    const relationshipTemplatePopulated = populateRelationshipTemplate(relationshipTemplate, entityTemplates);

    return (
        <Typography component="p" variant="body1">
            <Box component="span">{`${i18next.t(`ruleBreachInfo.relActionInfo.${actionType}`)} `}</Box>
            <RelationshipInfo
                relationshipTemplatePopulated={relationshipTemplatePopulated}
                sourceEntity={sourceEntity}
                destinationEntity={destinationEntity}
            />
        </Typography>
    );
};

const CreateOrDuplicateEntityActionInfo: React.FC<{
    actionType: ActionTypes.CreateEntity | ActionTypes.DuplicateEntity;
    actionMetadata: ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated;
    isCompact: boolean;
}> = ({ actionType, actionMetadata, isCompact }) => {
    const queryClient = useQueryClient();

    const { templateId, properties } = actionMetadata;

    const entity: IEntity = {
        templateId,
        properties: {
            // if entity wasnt created yet, put generated properties. if it has, it will override
            _id: 'created-entity-id',
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
                    <EntityLink entity={entity} entityTemplate={entityTemplate} linkable={entity.properties._id !== 'created-entity-id'} />
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
                    <EntityLink entity={entity} entityTemplate={entityTemplate} />
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
}> = ({ originUser, actionType, actionMetadata, isCompact }) => {
    return (
        <Grid container flexDirection="column">
            <Grid item>
                {(actionType === ActionTypes.CreateRelationship || actionType === ActionTypes.DeleteRelationship) && (
                    <CreateOrDeleteRelActionInfo
                        actionType={actionType}
                        actionMetadata={actionMetadata as ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated}
                    />
                )}
                {(actionType === ActionTypes.CreateEntity || actionType === ActionTypes.DuplicateEntity) && (
                    <CreateOrDuplicateEntityActionInfo
                        actionType={actionType}
                        actionMetadata={actionMetadata as ICreateEntityMetadataPopulated | IDuplicateEntityMetadataPopulated}
                        isCompact={isCompact}
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
