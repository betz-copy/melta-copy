import { useMatomo } from '@datapunt/matomo-tracker-react';
import { AddCircle, CloseFullscreenRounded, Expand, TableRowsOutlined } from '@mui/icons-material';
import { Box, Grid, useTheme } from '@mui/material';
import { IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { IConnection, IEntity, IEntityExpanded } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { ISubCompactPermissions, PermissionScope } from '@packages/permission';
import { IMongoRelationship, IRelationship } from '@packages/relationship';
import i18next from 'i18next';
import React, { useRef, useState } from 'react';
import { useQueryClient } from 'react-query';
import CreateRelationshipDialog from '../../common/dialogs/createRelationshipDialog';
import { AddEntityButton } from '../../common/EntitiesPage/Buttons/AddEntity';
import { ResetFilterButton } from '../../common/EntitiesPage/ResetFilterButton';
import { isUserHasWritePermissions } from '../../common/EntitiesPage/TemplateTable';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../common/EntitiesTableOfTemplate';
import { EntityLink } from '../../common/EntityLink';
import { EntityTemplateTextComponent, RelationshipTitle } from '../../common/RelationshipTitle';
import { TableButton } from '../../common/TableButton';
import '../../css/pages.css';
import { useClientSideUserStore } from '../../stores/clientSideUser';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { INestedRelationshipTemplates } from '.';
import DeleteRelationshipDialog from './DeleteRelationshipDialog';

export const getButtonState = (
    isEntityDisabled: boolean,
    hasWritePermissionToCurrTemplate: boolean,
    relatedTemplate: IMongoEntityTemplateWithConstraintsPopulated,
    groupChildTemplate: Record<string, IMongoChildTemplateWithConstraintsPopulated[]>,
    permissions?: ISubCompactPermissions,
) => {
    let isEditButtonsDisabled = false;
    let disabledButtonText = '';

    const childIds = groupChildTemplate[relatedTemplate._id]?.map(({ _id }) => _id);

    const categoryPermission = permissions?.instances?.categories?.[relatedTemplate.category._id];
    const permissionToRelatedTemplate =
        categoryPermission?.entityTemplates?.[relatedTemplate._id] ||
        childIds?.map((childId) => categoryPermission?.entityTemplates?.[childId]).find((perm) => !!perm) ||
        categoryPermission;

    if (isEntityDisabled) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('entityPage.disabledEntity');
    } else if (!hasWritePermissionToCurrTemplate) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHaveWritePermissions');
    } else if (!permissions?.admin && !permissions?.instances) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHaveWritePermissionsToTemplate');
    } else if (!permissions?.admin && permissionToRelatedTemplate?.scope !== PermissionScope.write) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHaveWritePermissionsToTemplate');
    } else {
        disabledButtonText = i18next.t('ruleManagement.create-relationship');
    }

    return { isEditButtonsDisabled, disabledButtonText, permissionToRelatedTemplate };
};

const ConnectionsTableTitle: React.FC<{
    expandedEntity: IEntityExpanded;
    connectionTemplate: Pick<INestedRelationshipTemplates, 'relationshipTemplate' | 'isExpandedEntityRelationshipSource'>;
}> = ({ expandedEntity, connectionTemplate: { relationshipTemplate, isExpandedEntityRelationshipSource } }) => {
    return (
        <RelationshipTitle
            relationshipTemplate={relationshipTemplate}
            renderEntityTemplateText={({ entityTemplate, isRelationshipSource }) => {
                if (isRelationshipSource === isExpandedEntityRelationshipSource) {
                    return (
                        <Box sx={{ whiteSpace: 'nowrap' }}>
                            <EntityLink entity={expandedEntity.entity} entityTemplate={entityTemplate} />
                        </Box>
                    );
                }

                return <EntityTemplateTextComponent entityTemplate={entityTemplate} />;
            }}
            style={{ padding: '5px 20px', width: 'fit-content' }}
        />
    );
};

export const ConnectionsTable: React.FC<{
    expandedEntity: IEntityExpanded;
    connectionTemplate: INestedRelationshipTemplates;
    templateIds: string[];
    isEditButtonsDisabled: boolean;
    disabledButtonText: string;
    hasPermissionToTemplate: boolean;
    groupChildTemplate?: Record<string, IMongoChildTemplateWithConstraintsPopulated[]>;
}> = ({
    expandedEntity,
    connectionTemplate: { relationshipTemplate, isExpandedEntityRelationshipSource, hasInstances },
    templateIds,
    isEditButtonsDisabled,
    disabledButtonText,
    hasPermissionToTemplate,
    groupChildTemplate,
}) => {
    const theme = useTheme();

    const workspace = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;

    const queryClient = useQueryClient();

    const { trackEvent } = useMatomo();

    const currentUser = useUserStore((state) => state.user);
    const currentClientSideUser = useClientSideUserStore((state) => state.clientSideUser);

    const [isExpand, setIsExpand] = useState(false);
    const [isFiltered, setIsFiltered] = useState(false);

    type EntityRef = IEntity | { relationship: Pick<IRelationship, 'properties' | 'templateId'>; sourceEntity: IEntity; destinationEntity: IEntity };

    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<EntityRef>>(null);

    const [createRelationshipDialogState, setCreateRelationshipDialogState] = useState<{
        isOpen: boolean;
        initialValues?: React.ComponentProps<typeof CreateRelationshipDialog>['initialValues'];
    }>({ isOpen: false });

    const [deleteRelationshipDialogState, setDeleteRelationshipDialogState] = useState<{
        open: boolean;
        connectionToDelete?: IEntityExpanded['connections'][number];
    }>({ open: false });

    const setQueryDataKey = [
        'getExpandedEntity',
        expandedEntity.entity.properties._id,
        { [expandedEntity.entity.properties._id]: { maxLevel: 1 } },
        { templateIds },
    ];

    const template = isExpandedEntityRelationshipSource ? relationshipTemplate.destinationEntity : relationshipTemplate.sourceEntity;
    const defaultRelationshipKey = Object.entries(template.properties.properties).find(
        ([_, value]) =>
            value.format === 'relationshipReference' &&
            value.relationshipReference &&
            value.relationshipReference.relationshipTemplateId === relationshipTemplate._id,
    )?.[0];

    const userHasWritePermissions = isUserHasWritePermissions(currentClientSideUser, currentUser, template);

    const onCreateRelationship = (createdRelationship: IMongoRelationship, sourceEntity: IEntity, destinationEntity: IEntity) => {
        const doesCreatedRelationshipWithCurrEntity = [createdRelationship.sourceEntityId, createdRelationship.destinationEntityId].includes(
            expandedEntity.entity.properties._id!,
        );

        if (!doesCreatedRelationshipWithCurrEntity) {
            return;
        }
        queryClient.setQueryData<IEntityExpanded>(setQueryDataKey, (prevEntityExpanded) => {
            return {
                ...prevEntityExpanded!,
                connections: [
                    ...prevEntityExpanded!.connections,
                    {
                        sourceEntity,
                        destinationEntity,
                        relationship: {
                            templateId: createdRelationship.templateId,
                            properties: createdRelationship.properties,
                        },
                    },
                ],
            };
        });
    };

    const onDeleteRelationship = (deletedRelationshipId: string) => {
        queryClient.setQueryData<IEntityExpanded>(setQueryDataKey, (prevEntityExpanded) => {
            if (!prevEntityExpanded) {
                return {
                    entity: expandedEntity.entity,
                    connections: [],
                };
            }

            const updatedEntityExpanded = { ...prevEntityExpanded };
            updatedEntityExpanded.connections = updatedEntityExpanded.connections.filter(
                ({ relationship }) => relationship.properties._id !== deletedRelationshipId,
            );

            return updatedEntityExpanded;
        });
    };

    return (
        <Grid>
            <Grid direction="column" justifyContent="space-between" marginBottom="10px">
                <Grid container marginTop="10px" width="fit-content">
                    <ConnectionsTableTitle
                        expandedEntity={expandedEntity}
                        connectionTemplate={{ relationshipTemplate, isExpandedEntityRelationshipSource }}
                    />
                </Grid>

                <Grid container justifyContent="space-between" alignItems="center">
                    <Grid container flexGrow={1} width={0} justifyContent="flex-start" alignItems="center">
                        <TableButton
                            iconButtonWithPopoverProps={{
                                popoverText: i18next.t('entitiesTableOfTemplate.columns'),
                                iconButtonProps: { onClick: () => entitiesTableRef.current?.showSideBar() },
                            }}
                            disableButton={!hasInstances}
                            icon={<TableRowsOutlined fontSize="small" />}
                            text={i18next.t('entitiesTableOfTemplate.columns')}
                        />

                        <TableButton
                            iconButtonWithPopoverProps={{
                                popoverText: i18next.t(`entitiesTableOfTemplate.expand${isExpand ? 'Less' : 'More'}`),
                                iconButtonProps: {
                                    onClick: () => setIsExpand(!isExpand),
                                },
                            }}
                            icon={isExpand ? <CloseFullscreenRounded fontSize="small" /> : <Expand fontSize="small" />}
                            text={i18next.t(`entitiesTableOfTemplate.expand${isExpand ? 'Less' : 'More'}Title`)}
                            disableButton={!hasInstances}
                        />

                        <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={!isFiltered} />
                    </Grid>
                    {relationshipTemplate.isProperty ? (
                        <AddEntityButton
                            initialStep={1}
                            disabled={!userHasWritePermissions || template.disabled}
                            initialValues={{
                                template,
                                properties: {
                                    ...(defaultRelationshipKey ? { [defaultRelationshipKey]: expandedEntity.entity } : {}),
                                    disabled: false,
                                },
                                attachmentsProperties: {},
                            }}
                            style={{
                                display: 'flex',
                                gap: '0.25rem',
                                borderRadius: '5px',
                                fontSize: '0.75rem',
                                color: theme.palette.primary.main,
                            }}
                            popoverText={template.disabled ? i18next.t('permissions.EntityTemplateDisplay') : undefined}
                            onSuccessCreate={() => {
                                queryClient.invalidateQueries({ queryKey: setQueryDataKey });

                                trackEvent({
                                    category: 'template-relationship-action',
                                    action: 'add entity click',
                                });
                            }}
                        >
                            <AddCircle fontSize="small" sx={{ opacity: !userHasWritePermissions ? 0.3 : 1 }} />
                            {i18next.t('entitiesTableOfTemplate.addRelationshipTitle')}
                        </AddEntityButton>
                    ) : (
                        <TableButton
                            iconButtonWithPopoverProps={{
                                popoverText: isEditButtonsDisabled
                                    ? disabledButtonText
                                    : i18next.t(`ruleManagement.${relationshipTemplate.isProperty ? 'cant-' : ''}create-relationship`),
                                iconButtonProps: {
                                    onClick: () => {
                                        const [defaultSourceEntity, defaultDestinationEntity] = isExpandedEntityRelationshipSource
                                            ? [expandedEntity.entity, null]
                                            : [null, expandedEntity.entity]; // if source and dest are the same template, then put currentEntity in source
                                        setCreateRelationshipDialogState({
                                            isOpen: true,
                                            initialValues: {
                                                relationshipTemplate,
                                                sourceEntity: defaultSourceEntity,
                                                destinationEntity: defaultDestinationEntity,
                                            },
                                        });
                                    },
                                },
                            }}
                            icon={<AddCircle fontSize="small" sx={{ opacity: isEditButtonsDisabled ? 0.3 : 1 }} />}
                            text={i18next.t('entitiesTableOfTemplate.addRelationshipTitle')}
                            disableButton={
                                isEditButtonsDisabled || relationshipTemplate.destinationEntity.disabled || relationshipTemplate.sourceEntity.disabled
                            }
                        />
                    )}
                </Grid>
            </Grid>
            <Box
                sx={{
                    marginBottom: '30px',
                    width: '100%',
                }}
            >
                <EntitiesTableOfTemplate
                    hasInstances={hasInstances}
                    ref={entitiesTableRef}
                    template={template}
                    showNavigateToRowButton
                    deleteRowButtonProps={{
                        popoverText: isEditButtonsDisabled
                            ? disabledButtonText
                            : i18next.t(`entityPage.deleteRelationshipPopoverText${relationshipTemplate.isProperty ? '-cant' : ''}`),
                        onClick: (connectionToDelete) => {
                            setDeleteRelationshipDialogState({ open: true, connectionToDelete });
                        },
                        disabledButton: isEditButtonsDisabled || relationshipTemplate.isProperty || false,
                    }}
                    getRowId={(connection: IEntity | IConnection) => {
                        if ('relationship' in connection) return connection.relationship.properties._id;

                        const foundConnection = expandedEntity.connections.find(
                            (conn) =>
                                conn.destinationEntity?.properties?._id === (connection as IEntity).properties?._id ||
                                conn.sourceEntity?.properties?._id === (connection as IEntity).properties?._id,
                        );
                        return foundConnection ? foundConnection.relationship.properties._id : (connection as IEntity).properties._id;
                    }}
                    getEntityPropertiesData={(connection: IEntity | IConnection) => {
                        if ('relationship' in connection) {
                            if (expandedEntity.entity.properties._id === connection.destinationEntity.properties._id)
                                return connection.sourceEntity.properties;
                            return connection.destinationEntity.properties;
                        }
                        return connection.properties;
                    }}
                    rowModelType={isExpand ? 'infinite' : 'clientSide'}
                    rowData={expandedEntity.connections.filter(({ relationship, sourceEntity, destinationEntity }) => {
                        if (relationship.templateId !== relationshipTemplate._id) return false;

                        if (isExpandedEntityRelationshipSource && expandedEntity.entity.properties._id === sourceEntity.properties._id) return true;
                        if (!isExpandedEntityRelationshipSource && expandedEntity.entity.properties._id === destinationEntity.properties._id)
                            return true;

                        return false;
                    })}
                    rowHeight={defaultRowHeight}
                    fontSize={`${defaultFontSize}px`}
                    saveStorageProps={{
                        shouldSaveFilter: false,
                        shouldSaveWidth: false,
                        shouldSaveVisibleColumns: false,
                        shouldSaveSorting: false,
                        shouldSaveColumnOrder: true,
                        shouldSavePagination: false,
                        shouldSaveScrollPosition: false,
                        pageType: `entity-${expandedEntity.entity.properties._id}`,
                    }}
                    onFilter={() => setIsFiltered(entitiesTableRef.current?.isFiltered() ?? false)}
                    hasPermissionToTemplate={hasPermissionToTemplate}
                    mainEntity={expandedEntity}
                    childTemplatesOfParent={groupChildTemplate?.[template._id]}
                />
            </Box>
            <CreateRelationshipDialog
                isOpen={createRelationshipDialogState.isOpen}
                handleClose={() => setCreateRelationshipDialogState({ isOpen: false })}
                onSubmitSuccess={onCreateRelationship}
                initialValues={createRelationshipDialogState.initialValues}
            />
            <DeleteRelationshipDialog
                isOpen={deleteRelationshipDialogState.open}
                connectionToDelete={deleteRelationshipDialogState.connectionToDelete}
                handleClose={() => setDeleteRelationshipDialogState({ open: false })}
                onSubmitSuccess={() => {
                    onDeleteRelationship(deleteRelationshipDialogState.connectionToDelete!.relationship.properties._id);
                    setDeleteRelationshipDialogState({ open: false });
                }}
            />
        </Grid>
    );
};
