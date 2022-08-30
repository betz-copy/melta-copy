import React from 'react';
import { Grid, Typography, styled } from '@mui/material';
import { useQueryClient } from 'react-query';
import i18next from 'i18next';
import { useNavigate } from 'react-router-dom';
import { IActivityLog } from '../../../../services/activityLogService';
import { IMongoRelationshipTemplate } from '../../../../interfaces/relationshipTemplates';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';

const StyledTypography = styled(Typography)({
    fontFamily: 'Rubik',
    fontWeight: 400,
    fontSize: '16px',
    color: 'rgb(110 104 104 / 87%)',
}) as typeof Typography;

const EmptyMetadataActionText: React.FC<{
    action: 'CREATE_ENTITY' | 'DISABLE_ENTITY' | 'ACTIVATE_ENTITY';
}> = ({ action }) => {
    const logTexts = {
        ACTIVATE_ENTITY: i18next.t('entityPage.activityLog.activateEntity'),
        DISABLE_ENTITY: i18next.t('entityPage.activityLog.disableEntity'),
        CREATE_ENTITY: i18next.t('entityPage.activityLog.createEntity'),
    };

    return (
        <Grid item minWidth="190px">
            <StyledTypography variant="body2">{logTexts[action]}</StyledTypography>
        </Grid>
    );
};

const RelationshipMetadataActionText: React.FC<{
    action: 'DELETE_RELATIONSHIP' | 'CREATE_RELATIONSHIP';
    actionMetadata: { relationshipId: string; relationshipTemplateId: string; entityId: string };
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ action, actionMetadata, entityTemplate }) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const relationshipTemplate = queryClient
        .getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!
        .find((template) => template._id === actionMetadata.relationshipTemplateId);
    const sourceAndDestinationTemplate = queryClient
        .getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!
        .filter((template) => template._id === relationshipTemplate?.sourceEntityId || template._id === relationshipTemplate?.destinationEntityId);

    return (
        <Grid item container>
            <StyledTypography variant="body2" component="span">
                {action === 'CREATE_RELATIONSHIP'
                    ? i18next.t('entityPage.activityLog.createRelationship')
                    : i18next.t('entityPage.activityLog.deleteRelationship')}
                <StyledTypography component="span" display="inline" variant="body2" style={{ color: '#225AA7' }}>
                    &quot;{relationshipTemplate?.displayName}&quot;{' '}
                </StyledTypography>
                {i18next.t('entityPage.activityLog.withEntity')}{' '}
                <StyledTypography
                    component="span"
                    display="inline"
                    variant="body2"
                    onClick={() => navigate(`/entity/${actionMetadata.entityId}`)}
                    style={{ color: '#225AA7', cursor: 'pointer' }}
                    borderBottom="1px solid"
                >
                    {sourceAndDestinationTemplate[0]._id === entityTemplate._id
                        ? sourceAndDestinationTemplate[1].displayName
                        : sourceAndDestinationTemplate[0].displayName}
                </StyledTypography>
            </StyledTypography>
        </Grid>
    );
};

const UpdateEntityMetadataActionText: React.FC<{
    actionMetadata: { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] };
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ actionMetadata, entityTemplate }) => {
    return (
        <Grid item minWidth="190px">
            <StyledTypography variant="body2" marginBottom="5px">
                {actionMetadata.updatedFields.length === 1
                    ? i18next.t('entityPage.activityLog.updateField')
                    : i18next.t('entityPage.activityLog.updateFields')}{' '}
            </StyledTypography>

            {actionMetadata.updatedFields.map((field) => {
                return (
                    <Grid key={field.fieldName}>
                        <StyledTypography
                            variant="body2"
                            style={{
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                maxWidth: '160px',
                                color: '#225AA7',
                                marginLeft: '10px',
                            }}
                            component="span"
                            display="inline-block"
                        >
                            {entityTemplate.properties.properties[field.fieldName].title}{' '}
                        </StyledTypography>

                        <StyledTypography
                            component="span"
                            variant="body2"
                            display="inline-block"
                            style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '160px', marginLeft: '10px' }}
                        >
                            {i18next.t('entityPage.activityLog.from')}{' '}
                            {field.oldValue ? `"${field.oldValue}"` : i18next.t('entityPage.activityLog.emptyField')}{' '}
                        </StyledTypography>

                        <StyledTypography
                            component="span"
                            variant="body2"
                            display="inline-block"
                            style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '160px' }}
                        >
                            {i18next.t('entityPage.activityLog.to')}{' '}
                            {field.newValue ? `"${field.newValue}"` : i18next.t('entityPage.activityLog.emptyField')}{' '}
                        </StyledTypography>
                    </Grid>
                );
            })}
        </Grid>
    );
};

const ActionText: React.FC<{
    log: IActivityLog;
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ log: { metadata, action }, entityTemplate }) => {
    if (action === 'CREATE_RELATIONSHIP' || action === 'DELETE_RELATIONSHIP')
        return (
            <RelationshipMetadataActionText
                entityTemplate={entityTemplate}
                action={action}
                actionMetadata={metadata as { relationshipId: string; relationshipTemplateId: string; entityId: string }}
            />
        );
    if (action === 'UPDATE_ENTITY')
        return (
            <UpdateEntityMetadataActionText
                entityTemplate={entityTemplate}
                actionMetadata={metadata as { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] }}
            />
        );
    return <EmptyMetadataActionText action={action} />;
};

export default ActionText;
