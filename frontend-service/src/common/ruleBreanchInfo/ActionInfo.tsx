import React, { useMemo } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { IEntity } from '../../interfaces/entities';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import {
    ActionTypes,
    IActionMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadataPopulated,
    IUpdateEntityMetadataPopulated,
    IUpdateEntityStatusMetadataPopulated,
} from '../../interfaces/ruleBreaches/actionMetadata';
import { populateRelationshipTemplate } from '../../utils/templates';
import { UpdatedFieldsDiff } from './UpdatedFieldsDiff';
import { IUser } from '../../services/kartoffelService';
import { EntityLink } from '../EntityLink';

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
