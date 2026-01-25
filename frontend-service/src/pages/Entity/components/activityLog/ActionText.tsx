import { Grid, styled, Typography, useTheme } from '@mui/material';
import { ActionsLog, IMongoActivityLog, IMongoUpdateProcessStepMetadata, IUpdatedFields } from '@packages/activity-log';
import { IPropertyValue } from '@packages/entity';
import { IEntitySingleProperty, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IMongoStepTemplatePopulated, IProcessDetails, IProcessSingleProperty } from '@packages/process';
import { IRelationshipTemplateMap } from '@packages/relationship-template';
import { CoordinateSystem } from '@packages/utils';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { useLocation } from 'wouter';
import MeltaTooltip from '../../../../common/MeltaDesigns/MeltaTooltip';
import { NotificationColor } from '../../../../common/notificationColor';
import RelationshipReferenceView from '../../../../common/RelationshipReferenceView';
import UserAvatar from '../../../../common/UserAvatar';
import { StatusDisplay } from '../../../../common/wizards/processInstance/ProcessSummaryStep/ProcessStatus';
import { activityLogConfigMap } from '../../../../interfaces/activityLog';
import { LocationData } from '../../../../interfaces/location';
import { IEntityTemplateMap } from '../../../../interfaces/template';
import { getFilesName } from '../../../../utils/getFileName';
import { containsHTMLTags, getFirstLine, getNumLines } from '../../../../utils/HtmlTagsStringValue';
import { locationConverterToString } from '../../../../utils/map/convert';

const TitleWithIcon = (action: ActionsLog) => {
    const config = activityLogConfigMap[action];
    return (
        <Grid container marginBottom="10px">
            <NotificationColor color={config.color} />
            <Typography variant="subtitle1" color="primary" fontWeight="400" fontSize="15px" paddingLeft="10px">
                {config.title}
            </Typography>
        </Grid>
    );
};

const StyledTypography = styled(Typography)(({ theme }) => ({
    fontFamily: 'Rubik',
    fontWeight: 400,
    fontSize: '16px',
    color: theme.palette.mode === 'dark' ? 'lightgray' : 'gray',
})) as typeof Typography;

const EmptyMetadataActionText: React.FC<{
    action: ActionsLog;
}> = ({ action }) => {
    const config = activityLogConfigMap[action];

    return (
        <Grid minWidth="190px">
            {TitleWithIcon(action)}
            <StyledTypography variant="body2">{config.text}</StyledTypography>
        </Grid>
    );
};

const RelationshipMetadataActionText: React.FC<{
    action: ActionsLog.DELETE_RELATIONSHIP | ActionsLog.CREATE_RELATIONSHIP;
    actionMetadata: { relationshipId: string; relationshipTemplateId: string; entityId: string };
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
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
        <Grid container>
            {TitleWithIcon(action)}
            <StyledTypography variant="body2" component="span">
                {action === ActionsLog.CREATE_RELATIONSHIP
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

const DuplicateEntityMetadataActionText: React.FC<{
    actionMetadata: { entityIdDuplicatedFrom: string };
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
}> = ({ actionMetadata, entityTemplate }) => {
    const theme = useTheme();
    const [_, navigate] = useLocation();

    return (
        <Grid minWidth="190px">
            {TitleWithIcon(ActionsLog.DUPLICATE_ENTITY)}
            <StyledTypography variant="body2" component="span">
                {i18next.t('entityPage.activityLog.duplicateEntityFrom')}
                <StyledTypography
                    component="span"
                    display="inline"
                    variant="body2"
                    onClick={() => navigate(`/entity/${actionMetadata.entityIdDuplicatedFrom}`)}
                    style={{ color: theme.palette.primary.main, cursor: 'pointer' }}
                    borderBottom="1px solid"
                >
                    {entityTemplate.displayName}
                </StyledTypography>
            </StyledTypography>
        </Grid>
    );
};

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

const isLocationData = (value: IPropertyValue): value is LocationData =>
    value && typeof value === 'object' && 'location' in value && 'coordinateSystem' in value;

const UpdateTextValue: React.FC<{
    value: string;
    old: boolean;
    fieldName: string;
    entityTemplateProperties: Record<string, IEntitySingleProperty> | Record<string, IProcessSingleProperty>;
}> = ({ value, old, fieldName, entityTemplateProperties }) => {
    let innerContent: React.ReactNode;
    if (isLocationData(value))
        innerContent =
            value.coordinateSystem === CoordinateSystem.UTM
                ? locationConverterToString(value.location, CoordinateSystem.WGS84, CoordinateSystem.UTM)
                : value.location;
    else {
        const containsHtmlTags = containsHTMLTags(value);
        innerContent = containsHtmlTags ? `"${getFirstLine(value)}${getNumLines(value) > 1 ? '...' : ''}"` : `"${value}"`;
    }
    const entityTemplateUpdatedField = entityTemplateProperties[fieldName];

    if (entityTemplateUpdatedField && entityTemplateUpdatedField.format === 'relationshipReference') {
        innerContent = (
            <RelationshipReferenceView
                entity={value}
                relatedTemplateId={entityTemplateUpdatedField.relationshipReference!.relatedTemplateId}
                relatedTemplateField={entityTemplateUpdatedField.relationshipReference!.relatedTemplateField}
            />
        );
    }

    const isFileIdFormat = (): boolean => {
        if (!entityTemplateProperties[fieldName]) return false;

        const { type, format } = entityTemplateProperties[fieldName];

        return (type === 'string' && format === 'fileId') || format === 'signature';
    };

    const isArrayOfFileIds = (): boolean => {
        if (!entityTemplateProperties[fieldName]) return false;

        const { type, items } = entityTemplateProperties[fieldName];

        return type === 'array' && items?.type === 'string' && items.format === 'fileId';
    };

    const isUserField = (): boolean => {
        if (!entityTemplateProperties[fieldName]) return false;

        const { type, format } = entityTemplateProperties[fieldName];

        return type === 'string' && format === 'user';
    };

    const contentDisplayNameByTemplate = (content: string, inTooltip = false) => {
        if (isUserField()) {
            const user = JSON.parse(value);

            if (inTooltip) return user.fullName;

            return <UserAvatar user={user} userIcon={{ size: 23 }} chip={{ size: 'small' }} shouldRenderTooltip={inTooltip} />;
        }
        if (isFileIdFormat()) {
            return getFilesName(content);
        }
        if (isArrayOfFileIds()) {
            return getFilesName(content);
        }

        return content;
    };

    return value && typeof innerContent === 'string' ? (
        <MeltaTooltip
            slotProps={{ popper: popperProps }}
            disableHoverListener={!innerContent}
            title={<Grid style={{ maxHeight: '500px', overflowY: 'auto' }}>{contentDisplayNameByTemplate(innerContent, true)}</Grid>}
            placement="top-start"
        >
            <Grid marginBottom="5px">
                <StyledTypography variant="body2" style={ellipsisStyle}>
                    {old ? i18next.t('entityPage.activityLog.from') : i18next.t('entityPage.activityLog.to')}{' '}
                    {contentDisplayNameByTemplate(innerContent)}
                </StyledTypography>
            </Grid>
        </MeltaTooltip>
    ) : (
        <StyledTypography variant="body2" style={{ ...ellipsisStyle, display: 'flex' }}>
            {old ? i18next.t('entityPage.activityLog.from') : i18next.t('entityPage.activityLog.to')}{' '}
            {value ? innerContent : i18next.t('entityPage.activityLog.emptyField')}
        </StyledTypography>
    );
};

const UpdateEntityMetadataActionText: React.FC<{
    actionMetadata: { updatedFields: IUpdatedFields[] };
    entityTemplateProperties: Record<string, IEntitySingleProperty> | Record<string, IProcessSingleProperty>;
}> = ({ actionMetadata, entityTemplateProperties }) => {
    const theme = useTheme();
    return (
        <Grid container flexDirection="column">
            {TitleWithIcon(ActionsLog.UPDATE_FIELDS)}
            <Grid minWidth="190px">
                <StyledTypography variant="body2" marginBottom="5px">
                    {actionMetadata.updatedFields.length === 1
                        ? i18next.t('entityPage.activityLog.updateField')
                        : i18next.t('entityPage.activityLog.updateFields')}{' '}
                </StyledTypography>

                {actionMetadata.updatedFields.map((field) => {
                    const { oldValue, newValue, fieldName } = field;

                    const isDeleted = !entityTemplateProperties[fieldName];

                    return (
                        <Grid key={fieldName} style={{ marginBottom: '10px' }}>
                            <StyledTypography
                                key={fieldName}
                                variant="body2"
                                style={{ ...ellipsisStyle, color: theme.palette.primary.main, fontWeight: '500' }}
                            >
                                {isDeleted
                                    ? `${fieldName} (${i18next.t('entityPage.activityLog.wasDeleted')})`
                                    : entityTemplateProperties[fieldName].title}
                            </StyledTypography>
                            {[oldValue, newValue].map((value, index) => {
                                return (
                                    <UpdateTextValue
                                        key={value}
                                        value={value}
                                        old={index === 0}
                                        fieldName={field.fieldName}
                                        entityTemplateProperties={entityTemplateProperties}
                                    />
                                );
                            })}
                        </Grid>
                    );
                })}
            </Grid>
        </Grid>
    );
};

const UpdateStepProcessMetadataActionText: React.FC<{
    actionMetadata: IMongoUpdateProcessStepMetadata['metadata'];
    entityTemplate: IMongoStepTemplatePopulated;
}> = ({ actionMetadata, entityTemplate }) => {
    return (
        <Grid minWidth="190px">
            {actionMetadata?.updatedFields && actionMetadata?.updatedFields.length > 0 && (
                <UpdateEntityMetadataActionText
                    actionMetadata={{ updatedFields: actionMetadata.updatedFields }}
                    entityTemplateProperties={entityTemplate.properties.properties}
                />
            )}
            {actionMetadata.status && (
                <Grid>
                    <StyledTypography variant="body2" marginBottom="5px">
                        {i18next.t('entityPage.activityLog.updatedStatus')}
                    </StyledTypography>
                    <StatusDisplay
                        status={actionMetadata.status}
                        text={i18next.t(`wizard.processInstance.summary.processStatuses.${actionMetadata.status}`)}
                        displayIcon={false}
                    />
                </Grid>
            )}
            {actionMetadata.comments && (
                <Grid>
                    <StyledTypography variant="body2" marginBottom="5px">
                        {i18next.t('entityPage.activityLog.updatedComment')}
                    </StyledTypography>
                    <Typography
                        variant="body1"
                        sx={{
                            paddingY: '5px',
                            paddingX: '10px',
                            wordBreak: 'break-word',
                            fontSize: '13px',
                            overflowY: 'auto',
                            maxHeight: '50px',
                        }}
                    >
                        {actionMetadata.comments}
                    </Typography>
                </Grid>
            )}
        </Grid>
    );
};

const ActionText: React.FC<{
    log: IMongoActivityLog;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated | IProcessDetails | IMongoStepTemplatePopulated;
}> = ({ log: { metadata, action }, entityTemplate }) => {
    if (action === ActionsLog.CREATE_RELATIONSHIP || action === ActionsLog.DELETE_RELATIONSHIP)
        return (
            <RelationshipMetadataActionText
                entityTemplate={entityTemplate as IMongoEntityTemplateWithConstraintsPopulated}
                action={action}
                actionMetadata={metadata as { relationshipId: string; relationshipTemplateId: string; entityId: string }}
            />
        );
    if (action === ActionsLog.UPDATE_ENTITY || action === ActionsLog.UPDATE_PROCESS)
        return (
            <UpdateEntityMetadataActionText
                entityTemplateProperties={entityTemplate.properties.properties}
                actionMetadata={metadata as { updatedFields: [{ fieldName: string; oldValue: IPropertyValue; newValue: IPropertyValue }] }}
            />
        );

    if (action === ActionsLog.UPDATE_PROCESS_STEP)
        return (
            <UpdateStepProcessMetadataActionText
                entityTemplate={entityTemplate as IMongoStepTemplatePopulated}
                actionMetadata={metadata as IMongoUpdateProcessStepMetadata['metadata']}
            />
        );

    if (action === ActionsLog.DUPLICATE_ENTITY)
        return (
            <DuplicateEntityMetadataActionText
                entityTemplate={entityTemplate as IMongoEntityTemplateWithConstraintsPopulated}
                actionMetadata={metadata as { entityIdDuplicatedFrom: string }}
            />
        );

    return <EmptyMetadataActionText action={action} />;
};

export default ActionText;
