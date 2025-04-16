/* eslint-disable no-nested-ternary */
import { Chip, Grid, styled, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { useLocation } from 'wouter';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import RelationshipReferenceView from '../../../../common/RelationshipReferenceView';
import { IEntitySingleProperty, IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { IActivityLog, IUpdateProcessStepMetadata } from '../../../../services/activityLogService';
import { containsHTMLTags, getFirstLine, getNumLines } from '../../../../utils/HtmlTagsStringValue';
import { getFilesName } from '../../../../utils/getFileName';
import { IProcessDetails, IProcessSingleProperty } from '../../../../interfaces/processes/processTemplate';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { StatusDisplay } from '../../../../common/wizards/processInstance/ProcessSummaryStep/ProcessStatus';
import { CoordinateSystem, LocationData } from '../../../../common/inputs/JSONSchemaFormik/RjsfLocationWidget';
import { locationConverterToString } from '../../../../utils/map/convert';
import { NotificationColor } from '../../../../common/notificationColor';
import UserAvatar from '../../../../common/UserAvatar';

const logTitles = {
    ACTIVATE_ENTITY: (
        <Grid item container marginBottom="10px">
            <NotificationColor color="#C5FF7B" />
            <Typography variant="subtitle1" color="primary" fontWeight="400" fontSize="15px" paddingLeft="10px">
                {i18next.t('entityPage.activityLog.titles.enableEntity')}
            </Typography>
        </Grid>
    ),
    DISABLE_ENTITY: (
        <Grid item container marginBottom="10px">
            <NotificationColor color="#B7B8B9" />
            <Typography variant="subtitle1" color="primary" fontWeight="400" fontSize="15px" paddingLeft="10px">
                {i18next.t('entityPage.activityLog.titles.disableEntity')}
            </Typography>
        </Grid>
    ),
    CREATE_ENTITY: (
        <Grid item container marginBottom="10px">
            <NotificationColor color="#84FF90" />
            <Typography variant="subtitle1" color="primary" fontWeight="400" fontSize="15px" paddingLeft="10px">
                {i18next.t('entityPage.activityLog.titles.createEntity')}
            </Typography>
        </Grid>
    ),
    DUPLICATE_ENTITY: (
        <Grid item container marginBottom="10px">
            <NotificationColor color="#ffc4e9" />
            <Typography variant="subtitle1" color="primary" fontWeight="400" fontSize="15px" paddingLeft="10px">
                {i18next.t('entityPage.activityLog.titles.duplicateEntity')}
            </Typography>
        </Grid>
    ),
    CREATE_PROCESS: (
        <Grid item container marginBottom="10px">
            <NotificationColor color="#84FF90" />
            <Typography variant="subtitle1" color="primary" fontWeight="400" fontSize="15px" paddingLeft="10px">
                {i18next.t('entityPage.activityLog.titles.createProcess')}
            </Typography>
        </Grid>
    ),
    UPDATE_FIELDS: (
        <Grid item container marginBottom="10px">
            <NotificationColor color="#8CCFFF" />
            <Typography variant="subtitle1" color="primary" fontWeight="400" fontSize="15px" paddingLeft="10px">
                {i18next.t('entityPage.activityLog.titles.updateFields')}
            </Typography>
        </Grid>
    ),
    DELETE_RELATIONSHIP: (
        <Grid item container marginBottom="10px">
            <NotificationColor color="#FF7979" />
            <Typography variant="subtitle1" color="primary" fontWeight="400" fontSize="15px" paddingLeft="10px">
                {i18next.t('entityPage.activityLog.titles.deleteRelationship')}
            </Typography>
        </Grid>
    ),
    CREATE_RELATIONSHIP: (
        <Grid item container marginBottom="10px">
            <NotificationColor color="#FFD18C" />
            <Typography variant="subtitle1" color="primary" fontWeight="400" fontSize="15px" paddingLeft="10px">
                {i18next.t('entityPage.activityLog.titles.createRelationship')}
            </Typography>
        </Grid>
    ),
};

const StyledTypography = styled(Typography)(({ theme }) => ({
    fontFamily: 'Rubik',
    fontWeight: 400,
    fontSize: '16px',
    color: theme.palette.mode === 'dark' ? 'lightgray' : 'gray',
})) as typeof Typography;

const EmptyMetadataActionText: React.FC<{
    action: 'CREATE_ENTITY' | 'DISABLE_ENTITY' | 'ACTIVATE_ENTITY' | 'VIEW_ENTITY' | 'CREATE_PROCESS';
}> = ({ action }) => {
    const logTexts = {
        ACTIVATE_ENTITY: i18next.t('entityPage.activityLog.activateEntity'),
        DISABLE_ENTITY: i18next.t('entityPage.activityLog.disableEntity'),
        CREATE_ENTITY: i18next.t('entityPage.activityLog.createEntity'),
        CREATE_PROCESS: i18next.t('entityPage.activityLog.createProcess'),
    };

    return (
        <Grid item minWidth="190px">
            {logTitles[action]}
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
            {logTitles[action]}
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

const DuplicateEntityMetadataActionText: React.FC<{
    actionMetadata: { entityIdDuplicatedFrom: string };
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ actionMetadata, entityTemplate }) => {
    const theme = useTheme();
    const [_, navigate] = useLocation();

    return (
        <Grid item minWidth="190px">
            {logTitles.DUPLICATE_ENTITY}
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

const isLocationData = (value: any): value is LocationData => {
    return value && typeof value === 'object' && 'location' in value && 'coordinateSystem' in value;
};

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

        return type === 'string' && format === 'fileId';
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

    const contentDisplayNameByTemplate = (content: string) => {
        if (isUserField()) {
            return (
                <Chip
                    sx={{ marginLeft: '5px' }}
                    size="small"
                    avatar={<UserAvatar user={JSON.parse(value)} size={23} bgColor="1E2775" />}
                    label={JSON.parse(value).fullName}
                />
            );
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
            PopperProps={popperProps}
            disableHoverListener={!innerContent}
            title={<Grid style={{ maxHeight: '500px', overflowY: 'auto' }}>{contentDisplayNameByTemplate(innerContent)}</Grid>}
            placement="top-start"
        >
            <Grid item marginBottom="5px">
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
    actionMetadata: { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] };
    entityTemplateProperties: Record<string, IEntitySingleProperty> | Record<string, IProcessSingleProperty>;
}> = ({ actionMetadata, entityTemplateProperties }) => {
    const theme = useTheme();
    return (
        <Grid item container flexDirection="column">
            {logTitles.UPDATE_FIELDS}
            <Grid item minWidth="190px">
                <StyledTypography variant="body2" marginBottom="5px">
                    {actionMetadata.updatedFields.length === 1
                        ? i18next.t('entityPage.activityLog.updateField')
                        : i18next.t('entityPage.activityLog.updateFields')}{' '}
                </StyledTypography>

                {actionMetadata.updatedFields.map((field) => {
                    const { oldValue, newValue, fieldName } = field;

                    const deleted = entityTemplateProperties[fieldName];
                    const isDeleted = deleted === undefined;

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
    actionMetadata: IUpdateProcessStepMetadata['metadata'];
    entityTemplate: IMongoStepTemplatePopulated;
}> = ({ actionMetadata, entityTemplate }) => {
    return (
        <Grid item minWidth="190px">
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
    log: IActivityLog;
    entityTemplate: IMongoEntityTemplatePopulated | IProcessDetails | IMongoStepTemplatePopulated;
}> = ({ log: { metadata, action }, entityTemplate }) => {
    if (action === 'CREATE_RELATIONSHIP' || action === 'DELETE_RELATIONSHIP')
        return (
            <RelationshipMetadataActionText
                entityTemplate={entityTemplate as IMongoEntityTemplatePopulated}
                action={action}
                actionMetadata={metadata as { relationshipId: string; relationshipTemplateId: string; entityId: string }}
            />
        );
    if (action === 'UPDATE_ENTITY' || action === 'UPDATE_PROCESS')
        return (
            <UpdateEntityMetadataActionText
                entityTemplateProperties={entityTemplate.properties.properties}
                actionMetadata={metadata as { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] }}
            />
        );

    if (action === 'UPDATE_PROCESS_STEP')
        return (
            <UpdateStepProcessMetadataActionText
                entityTemplate={entityTemplate as IMongoStepTemplatePopulated}
                actionMetadata={metadata as IUpdateProcessStepMetadata['metadata']}
            />
        );

    if (action === 'DUPLICATE_ENTITY')
        return (
            <DuplicateEntityMetadataActionText
                entityTemplate={entityTemplate as IMongoEntityTemplatePopulated}
                actionMetadata={metadata as { entityIdDuplicatedFrom: string }}
            />
        );

    return <EmptyMetadataActionText action={action} />;
};

export default ActionText;
