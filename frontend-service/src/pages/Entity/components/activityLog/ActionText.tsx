import { Grid, styled, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { useLocation } from 'wouter';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { IActivityLog } from '../../../../services/activityLogService';

const StyledTypography = styled(Typography)(({ theme }) => ({
    fontFamily: 'Rubik',
    fontWeight: 400,
    fontSize: '16px',
    color: theme.palette.mode === 'dark' ? 'lightgray' : 'gray',
})) as typeof Typography;

const EmptyMetadataActionText: React.FC<{
    action: 'CREATE_ENTITY' | 'DISABLE_ENTITY' | 'ACTIVATE_ENTITY' | 'VIEW_ENTITY';
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
    const theme = useTheme();

    const [_, navigate] = useLocation();
    const queryClient = useQueryClient();

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const relationshipTemplate = relationshipTemplates.get(actionMetadata.relationshipTemplateId);

    const otherEntityTemplateId =
        relationshipTemplate?.sourceEntityId !== entityTemplate._id
            ? relationshipTemplate?.sourceEntityId
            : relationshipTemplate?.destinationEntityId;
    const otherEntityTemplate = otherEntityTemplateId ? entityTemplates.get(otherEntityTemplateId) : undefined;

    return (
        <Grid item container>
            <StyledTypography variant="body2" component="span">
                {action === 'CREATE_RELATIONSHIP'
                    ? i18next.t('entityPage.activityLog.createRelationship')
                    : i18next.t('entityPage.activityLog.deleteRelationship')}
                <StyledTypography component="span" display="inline" variant="body2" style={{ color: theme.palette.primary.main }}>
                    {' '}
                    &quot;{relationshipTemplate ? relationshipTemplate.displayName : i18next.t('entityPage.activityLog.undefined')}&quot;{' '}
                </StyledTypography>
                {relationshipTemplate && (
                    <>
                        {`${i18next.t('entityPage.activityLog.withEntity')} `}
                        <StyledTypography
                            component="span"
                            display="inline"
                            variant="body2"
                            onClick={() => navigate(`/entity/${actionMetadata?.entityId}`)}
                            style={{ color: theme.palette.primary.main, cursor: 'pointer' }}
                            borderBottom="1px solid"
                        >
                            {otherEntityTemplate?.displayName}
                        </StyledTypography>
                    </>
                )}
            </StyledTypography>
        </Grid>
    );
};

const UpdateEntityMetadataActionText: React.FC<{
    actionMetadata: { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] };
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ actionMetadata, entityTemplate }) => {
    const theme = useTheme();
    const ellipsisStyle: React.CSSProperties = {
        marginLeft: '10px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        maxWidth: '300px',
    };

    const popperProps = {
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: [0, -10],
                },
            },
        ],
    };
    return (
        <Grid item minWidth="190px">
            <StyledTypography variant="body2" marginBottom="5px">
                {actionMetadata.updatedFields.length === 1
                    ? i18next.t('entityPage.activityLog.updateField')
                    : i18next.t('entityPage.activityLog.updateFields')}{' '}
            </StyledTypography>

            {actionMetadata.updatedFields.map((field) => {
                return (
                    <Grid key={field.fieldName} style={{ marginBottom: '10px' }}>
                        <StyledTypography variant="body2" style={{ ...ellipsisStyle, color: theme.palette.primary.main }}>
                            {entityTemplate.properties.properties[field.fieldName].title}
                        </StyledTypography>
                        <MeltaTooltip
                            PopperProps={popperProps}
                            title={field.oldValue ? field.oldValue : i18next.t('entityPage.activityLog.emptyField')}
                            placement="top-start"
                        >
                            <Grid>
                                <StyledTypography variant="body2" style={ellipsisStyle}>
                                    {i18next.t('entityPage.activityLog.from')}{' '}
                                    {field.oldValue ? `"${field.oldValue}"` : i18next.t('entityPage.activityLog.emptyField')}
                                </StyledTypography>
                            </Grid>
                        </MeltaTooltip>
                        <MeltaTooltip
                            placement="bottom-start"
                            PopperProps={popperProps}
                            title={field.newValue ? field.newValue : i18next.t('entityPage.activityLog.emptyField')}
                        >
                            <Grid>
                                <StyledTypography variant="body2" style={ellipsisStyle}>
                                    {i18next.t('entityPage.activityLog.to')}{' '}
                                    {field.newValue ? `"${field.newValue}"` : i18next.t('entityPage.activityLog.emptyField')}
                                </StyledTypography>
                            </Grid>
                        </MeltaTooltip>
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
