import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { NavLink } from 'react-router-dom';
import { IEntity } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated } from '../../interfaces/relationshipTemplates';
import {
    ActionTypes,
    IActionMetadataPopulated,
    ICreateRelationshipMetadataPopulated,
    IDeleteRelationshipMetadataPopulated,
    IUpdateEntityMetadataPopulated,
} from '../../interfaces/ruleBreaches/actionMetadata';
import { populateRelationshipTemplate } from '../../utils/templates';
import { UpdatedFieldsDiff } from './UpdatedFieldsDiff';
import { IUser } from '../../services/kartoffelService';

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
            <NavLink to={`/entity/${sourceEntity ? sourceEntity.properties._id : 'unknownEntity'}`}>
                {relationshipTemplatePopulated.sourceEntity.displayName}
            </NavLink>{' '}
            <Box component="span">{i18next.t('ruleBreachInfo.relActionInfo.toEntity')}</Box>{' '}
            <NavLink to={`/entity/${destinationEntity ? destinationEntity.properties._id : 'unknownEntity'}`}>
                {relationshipTemplatePopulated.destinationEntity.displayName}
            </NavLink>
        </>
    );
};

const CreateOrDeleteRelActionInfo: React.FC<{
    actionType: ActionTypes.CreateRelationship | ActionTypes.DeleteRelationship;
    actionMetadata: ICreateRelationshipMetadataPopulated | IDeleteRelationshipMetadataPopulated;
}> = ({ actionType, actionMetadata }) => {
    const queryClient = useQueryClient();

    const { sourceEntity, destinationEntity, relationshipTemplateId } = actionMetadata;

    const relationshipTemplates = queryClient.getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;

    const relationshipTemplate = relationshipTemplates.find(({ _id }) => _id === relationshipTemplateId)!;
    const relationshipTemplatePopulated = populateRelationshipTemplate(relationshipTemplate, entityTemplates);

    return (
        <Typography component="p" variant="body1">
            <Box component="span">
                {actionType === ActionTypes.CreateRelationship && i18next.t('ruleBreachInfo.relActionInfo.creation')}
                {actionType === ActionTypes.DeleteRelationship && i18next.t('ruleBreachInfo.relActionInfo.deletion')}
            </Box>{' '}
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

    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const entityTemplate = !entity ? null : entityTemplates.find(({ _id }) => _id === entity.templateId)!;

    return (
        <Grid container direction="column">
            <Grid item>
                <Typography component="p" variant="body1">
                    <Box component="span">{i18next.t('ruleBreachInfo.updateEntityActionInfo.updatingEntity')}</Box>{' '}
                    <NavLink to={`/entity/${entity ? entity.properties._id : 'unknownEntity'}`}>
                        {entityTemplate ? entityTemplate.displayName : i18next.t('ruleBreachInfo.updateEntityActionInfo.unknownEntity')}
                    </NavLink>
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

export const ActionInfo: React.FC<{
    originUser?: IUser;
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
    isCompact: boolean;
}> = ({ originUser, actionType, actionMetadata, isCompact }) => {
    return (
        <Grid container>
            <Grid item>
                {actionType !== ActionTypes.UpdateEntity && (
                    <CreateOrDeleteRelActionInfo
                        actionType={actionType}
                        actionMetadata={actionMetadata as Exclude<IActionMetadataPopulated, IUpdateEntityMetadataPopulated>}
                    />
                )}
                {actionType === ActionTypes.UpdateEntity && (
                    <UpdateEntityActionInfo actionMetadata={actionMetadata as IUpdateEntityMetadataPopulated} isCompact={isCompact} />
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
