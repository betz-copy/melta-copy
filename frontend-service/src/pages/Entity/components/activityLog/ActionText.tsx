import { Grid, styled, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { useLocation } from 'wouter';
import { MeltaTooltip } from '../../../../common/MeltaTooltip';
import RelationshipReferenceView from '../../../../common/RelationshipReferenceView';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { IActivityLog } from '../../../../services/activityLogService';
import { containsHTMLTags, getFirstLine, getNumLines, renderHTML } from '../../../../utils/HtmlTagsStringValue';
import { getFileName, getFilesName } from '../../../../utils/getFileName';
import { P } from '../../../../utils/icons/fa6Icons';

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

const DuplicateEntityMetadataActionText: React.FC<{
    actionMetadata: { entityIdDuplicatedFrom: string };
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ actionMetadata, entityTemplate }) => {
    const theme = useTheme();
    const [_, navigate] = useLocation();

    return (
        <Grid item minWidth="190px">
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

const UpdateTextValue: React.FC<{ value: any; old: boolean; fieldName: string; entityTemplate: IMongoEntityTemplatePopulated }> = ({
    value,
    old,
    fieldName,
    entityTemplate,
}) => {
    const containsHtmlTags = containsHTMLTags(value);
    let innerContent: React.ReactNode = containsHtmlTags ? `"${getFirstLine(value)}${getNumLines(value) > 1 ? '...' : ''}"` : `"${value}"`;
    let titleContent: string = containsHtmlTags ? renderHTML(value) : value;
    const entityTemplateUpdatedField = entityTemplate.properties.properties[fieldName];

    if (entityTemplateUpdatedField.format === 'relationshipReference') {
        innerContent = (
            <RelationshipReferenceView
                entity={value}
                relatedTemplateId={entityTemplateUpdatedField.relationshipReference!.relatedTemplateId}
                relatedTemplateField={entityTemplateUpdatedField.relationshipReference!.relatedTemplateField}
            />
        );
        titleContent = '';
    }

    const contentDisplayNameByTemplate = (content: string) => {
        if (isFileIdFormat()) {
            return getFilesName(content);
        } else if (isArrayOfFileIds()) {
            return getFilesName(content);
        }

        return content;
    };

    const isFileIdFormat = (): boolean => {
        const { type, format } = entityTemplate.properties.properties[fieldName];

        return type === 'string' && format === 'fileId';
    };

    const isArrayOfFileIds = (): boolean => {
        const { type, items } = entityTemplate.properties.properties[fieldName];

        return type === 'array' && items?.type === 'string' && items.format === 'fileId';
    };

    return (
        <MeltaTooltip
            PopperProps={popperProps}
            disableHoverListener={!innerContent}
            title={
                <Grid style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {value
                        ? typeof innerContent === 'string'
                            ? contentDisplayNameByTemplate(innerContent)
                            : innerContent
                        : i18next.t('entityPage.activityLog.emptyField')}
                </Grid>
            }
            placement="top-start"
        >
            <Grid>
                <StyledTypography variant="body2" style={ellipsisStyle}>
                    {old ? i18next.t('entityPage.activityLog.from') : i18next.t('entityPage.activityLog.to')}{' '}
                    {value
                        ? typeof innerContent === 'string'
                            ? contentDisplayNameByTemplate(innerContent)
                            : innerContent
                        : i18next.t('entityPage.activityLog.emptyField')}
                </StyledTypography>
            </Grid>
        </MeltaTooltip>
    );
};

const UpdateEntityMetadataActionText: React.FC<{
    actionMetadata: { updatedFields: [{ fieldName: string; oldValue: any; newValue: any }] };
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ actionMetadata, entityTemplate }) => {
    const theme = useTheme();
    return (
        <Grid item minWidth="190px">
            <StyledTypography variant="body2" marginBottom="5px">
                {actionMetadata.updatedFields.length === 1
                    ? i18next.t('entityPage.activityLog.updateField')
                    : i18next.t('entityPage.activityLog.updateFields')}{' '}
            </StyledTypography>

            {actionMetadata.updatedFields.map((field) => {
                const { oldValue, newValue, fieldName } = field;

                const deleted = entityTemplate.properties.properties[fieldName];
                const isDeleted = deleted === undefined;

                return (
                    <Grid key={fieldName} style={{ marginBottom: '10px' }}>
                        <StyledTypography key={fieldName} variant="body2" style={{ ...ellipsisStyle, color: theme.palette.primary.main }}>
                            {isDeleted
                                ? `${fieldName} (${i18next.t('entityPage.activityLog.wasDeleted')})`
                                : entityTemplate.properties.properties[fieldName].title}
                        </StyledTypography>
                        {[oldValue, newValue].map((value, index) => (
                            <UpdateTextValue
                                key={value}
                                value={value}
                                old={index === 0}
                                fieldName={field.fieldName}
                                entityTemplate={entityTemplate}
                            />
                        ))}
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

    if (action === 'DUPLICATE_ENTITY')
        return <DuplicateEntityMetadataActionText entityTemplate={entityTemplate} actionMetadata={metadata as { entityIdDuplicatedFrom: string }} />;

    return <EmptyMetadataActionText action={action} />;
};

export default ActionText;
