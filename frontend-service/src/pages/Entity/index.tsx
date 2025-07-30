import { AddCircle, CloseFullscreenRounded, Expand, Hive as HiveIcon, TableRowsOutlined } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, CircularProgress, Grid, Tab, Typography, useTheme } from '@mui/material';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'wouter';
import { BlueTitle } from '../../common/BlueTitle';
import { CustomIcon } from '../../common/CustomIcon';
import CreateRelationshipDialog from '../../common/dialogs/createRelationshipDialog';
import { ResetFilterButton } from '../../common/EntitiesPage/ResetFilterButton';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef, IConnection } from '../../common/EntitiesTableOfTemplate';
import { EntityLink } from '../../common/EntityLink';
import { EntityTemplateTextComponent, RelationshipTitle } from '../../common/RelationshipTitle';
import { TableButton } from '../../common/TableButton';
import '../../css/pages.css';
import { ICategoryMap } from '../../interfaces/categories';
import { IChildTemplateMap } from '../../interfaces/childTemplates';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { PermissionScope } from '../../interfaces/permissions';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';
import { IRelationship } from '../../interfaces/relationships';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { useSearchParams } from '../../utils/hooks/useSearchParams';
import { checkUserTemplatePermission } from '../../utils/permissions/instancePermissions';
import { getAllAllowedEntities, getAllAllowedRelationships } from '../../utils/permissions/templatePermissions';
import { populateRelationshipTemplate } from '../../utils/templates';
import { EntityDetails } from './components/EntityDetails';
import { EntityTopBar } from './components/TopBar';
import DeleteRelationshipDialog from './DeleteRelationshipDialog';
import { RelationshipIcon } from './RelationshipIcon';

export const getButtonState = (
    isEntityDisabled: boolean,
    hasWritePermissionToCurrTemplate: boolean,
    relatedTemplate: IMongoEntityTemplatePopulated,
    permissions?: ISubCompactPermissions,
) => {
    let isEditButtonsDisabled = false;
    let disabledButtonText = '';
    const categoryPermission = permissions?.instances?.categories?.[relatedTemplate.category._id];
    const permissionToRelatedTemplate = categoryPermission?.entityTemplates?.[relatedTemplate._id] || categoryPermission;

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
    connectionTemplate: IConnectionTemplateOfExpandedEntity;
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
    connectionTemplate: IConnectionTemplateOfExpandedEntity;
    templateIds: string[];
    isEditButtonsDisabled: boolean;
    disabledButtonText: string;
    hasPermissionToTemplate: boolean;
}> = ({
    expandedEntity,
    connectionTemplate: { relationshipTemplate, isExpandedEntityRelationshipSource, hasInstances },
    templateIds,
    isEditButtonsDisabled,
    disabledButtonText,
    hasPermissionToTemplate,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { defaultRowHeight, defaultFontSize } = workspace.metadata.agGrid;

    const queryClient = useQueryClient();

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
        { [expandedEntity.entity.properties._id]: 1 },
        { templateIds },
    ];
    const onCreateRelationship = (createdRelationship: IRelationship, sourceEntity: IEntity, destinationEntity: IEntity) => {
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
            <Grid container item justifyContent="space-between" marginBottom="10px">
                <Grid item container marginTop="10px" width="fit-content">
                    <ConnectionsTableTitle
                        expandedEntity={expandedEntity}
                        connectionTemplate={{ relationshipTemplate, isExpandedEntityRelationshipSource }}
                    />
                </Grid>

                <Grid item container justifyContent="space-between" alignItems="center">
                    <Grid container item flexGrow={1} width={0} justifyContent="flex-start" alignItems="center">
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
                                popoverText: isExpand
                                    ? i18next.t('entitiesTableOfTemplate.expandLess')
                                    : i18next.t('entitiesTableOfTemplate.expandMore'),
                                iconButtonProps: {
                                    onClick: () => {
                                        setIsExpand(!isExpand);
                                    },
                                },
                            }}
                            icon={isExpand ? <CloseFullscreenRounded fontSize="small" /> : <Expand fontSize="small" />}
                            text={i18next.t(`entitiesTableOfTemplate.expand${isExpand ? 'Less' : 'More'}Title`)}
                            disableButton={!hasInstances}
                        />

                        <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={!isFiltered} />
                    </Grid>
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
                            isEditButtonsDisabled ||
                            relationshipTemplate.isProperty ||
                            relationshipTemplate.destinationEntity.disabled ||
                            relationshipTemplate.sourceEntity.disabled
                        }
                    />
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
                    template={isExpandedEntityRelationshipSource ? relationshipTemplate.destinationEntity : relationshipTemplate.sourceEntity}
                    showNavigateToRowButton
                    deleteRowButtonProps={{
                        popoverText: isEditButtonsDisabled
                            ? disabledButtonText
                            : i18next.t(`entityPage.deleteRelationshipPopoverText${relationshipTemplate.isProperty ? '-cant' : ''}`),
                        onClick: (connectionToDelete: any) => {
                            setDeleteRelationshipDialogState({ open: true, connectionToDelete });
                        },
                        disabledButton: isEditButtonsDisabled || relationshipTemplate.isProperty || false,
                    }}
                    getRowId={(connection: IEntity | IConnection) => {
                        if ('relationship' in connection) {
                            return connection.relationship.properties._id;
                        }

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
                    rowData={expandedEntity.connections.filter((connection) => {
                        if (connection.relationship.templateId !== relationshipTemplate._id) return false;

                        if (isExpandedEntityRelationshipSource && expandedEntity.entity.properties._id === connection.sourceEntity.properties._id)
                            return true;
                        if (
                            !isExpandedEntityRelationshipSource &&
                            expandedEntity.entity.properties._id === connection.destinationEntity.properties._id
                        ) {
                            return true;
                        }

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

export interface IConnectionTemplateOfExpandedEntity {
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    isExpandedEntityRelationshipSource: boolean; // for relationship that is of format currentEntityTemplate -> currentEntityTemplate, we want it twice, once with outgoing connections of expandedEntity, and once with incoming connections of expandedEntity
    hasInstances?: boolean;
}

const Entity: React.FC = () => {
    const theme = useTheme();

    const { entityId } = useParams();
    const queryClient = useQueryClient();
    const { setDisabledActions, setCurrentStep } = useTour();

    const [searchParams, _setSearchParams] = useSearchParams();
    const childTemplateId = searchParams.get('childTemplateId') ?? undefined;

    const currentUser = useUserStore((state) => state.user);

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const allowedEntityTemplates: IMongoEntityTemplatePopulated[] = getAllAllowedEntities(
        Array.from(Array.from(entityTemplates.values())),
        currentUser,
    );
    const allowedEntityTemplatesIds: string[] = allowedEntityTemplates.map((entity) => entity._id);
    const allowedRelationships = getAllAllowedRelationships(Array.from(relationshipTemplates.values()), allowedEntityTemplatesIds);

    const templateIds = Array.from(entityTemplates.keys());

    const expanded = entityId ? { [entityId]: 1 } : {};
    const { data: expandedEntity } = useQuery(['getExpandedEntity', entityId, expanded, { templateIds }], () =>
        getExpandedEntityByIdRequest(entityId!, expanded, { templateIds }),
    );

    const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

    useEffect(() => {
        if (!expandedEntity) return;

        setCurrentStep((currStep) => currStep + 1);
        setDisabledActions(false);
    }, [expandedEntity]); // eslint-disable-line react-hooks/exhaustive-deps

    const isEntityDisabled = !!expandedEntity?.entity.properties.disabled;
    const currentEntityTemplate = childTemplateId
        ? childTemplates.get(childTemplateId)
        : entityTemplates.get(expandedEntity?.entity.templateId ?? '');

    const hasWritePermissionToCurrTemplate = checkUserTemplatePermission(
        currentUser.currentWorkspacePermissions,
        currentEntityTemplate?.category?._id ?? '',
        currentEntityTemplate?._id ?? '',
        PermissionScope.write,
    );

    const populatedRelationshipTemplates = allowedRelationships.map((currRelationshipTemplate) =>
        populateRelationshipTemplate(currRelationshipTemplate, allowedEntityTemplates),
    );
    const connectionsTemplates: IConnectionTemplateOfExpandedEntity[] = [];

    populatedRelationshipTemplates.forEach((relationshipTemplate) => {
        const hasInstances = !!expandedEntity?.connections.some(
            (connection) => 'relationship' in connection && connection.relationship.templateId === relationshipTemplate._id,
        );

        if (
            !(
                relationshipTemplate.isProperty &&
                currentEntityTemplate?.properties.properties[relationshipTemplate.name]?.relationshipReference?.relationshipTemplateId ===
                    relationshipTemplate._id
            )
        ) {
            if (relationshipTemplate.sourceEntity._id === currentEntityTemplate?._id) {
                connectionsTemplates.push({
                    relationshipTemplate,
                    isExpandedEntityRelationshipSource: true,
                    hasInstances,
                });
            }
            if (relationshipTemplate.destinationEntity._id === currentEntityTemplate?._id) {
                connectionsTemplates.push({
                    relationshipTemplate,
                    isExpandedEntityRelationshipSource: false,
                    hasInstances,
                });
            }
        }
    });

    const categoriesWithConnectionsTemplates = Array.from(categories.values(), (category) => {
        return {
            category,
            connectionsTemplates: connectionsTemplates
                .filter(({ relationshipTemplate, isExpandedEntityRelationshipSource }) => {
                    const otherEntityTemplate = isExpandedEntityRelationshipSource
                        ? relationshipTemplate.destinationEntity
                        : relationshipTemplate.sourceEntity;
                    return otherEntityTemplate.category._id === category._id;
                })
                .sort((a, b) => Number(b.hasInstances) - Number(a.hasInstances)),
            relationshipCount:
                // calculate the amount of the related connections of each entity
                expandedEntity?.connections.filter((connection) => {
                    const connectionRelationshipTemplate = relationshipTemplates.get(connection.relationship.templateId)!;

                    if (
                        connectionRelationshipTemplate.isProperty &&
                        currentEntityTemplate?.properties.properties[connectionRelationshipTemplate.name]?.relationshipReference
                            ?.relationshipTemplateId === connectionRelationshipTemplate._id
                    )
                        return false;

                    if (expandedEntity.entity.properties._id === connection.destinationEntity.properties._id)
                        return entityTemplates.get(connection.sourceEntity.templateId)!.category._id === category._id;

                    return entityTemplates.get(connection.destinationEntity.templateId)!.category._id === category._id;
                }).length,
        };
    })
        .filter((currCategory) => currCategory.connectionsTemplates?.length > 0)
        .sort((a, b) => (b?.relationshipCount ?? 0) - (a?.relationshipCount ?? 0));

    useEffect(() => {
        if (categoriesWithConnectionsTemplates.length > 0 && selectedTabId === null) {
            setSelectedTabId(categoriesWithConnectionsTemplates[0].category._id);
        }
    }, [categoriesWithConnectionsTemplates, selectedTabId]);

    // Early return if data is not ready - must be after all hooks
    if (!expandedEntity || !currentEntityTemplate || !currentEntityTemplate.category) {
        return <CircularProgress />;
    }

    return (
        <>
            <EntityTopBar entityTemplate={currentEntityTemplate} expandedEntity={expandedEntity} connectionsTemplates={connectionsTemplates} />
            <Grid className="pageMargin">
                <Grid item marginTop="20px" data-tour="entity-details">
                    <EntityDetails entityTemplate={currentEntityTemplate} expandedEntity={expandedEntity} />
                </Grid>
                {categoriesWithConnectionsTemplates.length > 0 && (
                    <Grid data-tour="connected-entities" style={{ marginTop: '2rem' }}>
                        <Grid item container xs={5} alignItems="center" gap="20px">
                            <Grid item alignContent="center">
                                <RelationshipIcon />
                            </Grid>
                            <Grid item>
                                <BlueTitle
                                    title={i18next.t('entityPage.relationshipTitle')}
                                    component="h5"
                                    variant="h5"
                                    style={{ fontSize: '20px', fontWeight: 'semi-bold' }}
                                />
                            </Grid>
                        </Grid>
                        <Grid item>
                            <TabContext value={selectedTabId ?? categoriesWithConnectionsTemplates[0]?.category._id}>
                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                    <TabList variant="scrollable" scrollButtons="auto" onChange={(_event, newValue) => setSelectedTabId(newValue)}>
                                        {categoriesWithConnectionsTemplates.map(
                                            ({ category: { _id, displayName, iconFileId }, relationshipCount }) => (
                                                <Tab
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        gap: '15px',
                                                        height: '20px',
                                                        alignItems: 'center',
                                                    }}
                                                    key={_id}
                                                    label={
                                                        <Grid container flexDirection="row" alignItems="center" flexWrap="nowrap" gap="10px">
                                                            <Typography
                                                                color={selectedTabId === _id ? theme.palette.primary.main : '#787C9E'}
                                                                style={{ fontWeight: '500', fontSize: '16px' }}
                                                            >
                                                                {displayName}
                                                            </Typography>
                                                            <Typography color="#787C9E">{relationshipCount}</Typography>
                                                        </Grid>
                                                    }
                                                    value={_id}
                                                    icon={
                                                        iconFileId ? (
                                                            <CustomIcon
                                                                iconUrl={iconFileId}
                                                                height="24px"
                                                                width="24px"
                                                                color={selectedTabId === _id ? theme.palette.primary.main : '#787C9E'}
                                                            />
                                                        ) : (
                                                            <HiveIcon
                                                                fontSize="medium"
                                                                sx={{
                                                                    color: selectedTabId === _id ? theme.palette.primary.main : '#787C9E',
                                                                }}
                                                            />
                                                        )
                                                    }
                                                />
                                            ),
                                        )}
                                    </TabList>
                                </Box>
                                {categoriesWithConnectionsTemplates.map(
                                    ({ category: { _id }, connectionsTemplates: connectionsTemplatesOfCategory }) => {
                                        const isAdmin = Boolean(currentUser.currentWorkspacePermissions?.admin) || false;

                                        return (
                                            <TabPanel key={_id} value={_id}>
                                                {connectionsTemplatesOfCategory.map((connectionTemplate, connectedRelationshipTemplateIndex) => {
                                                    const relationship = connectionTemplate.relationshipTemplate;
                                                    const relatedTemplate =
                                                        relationship.destinationEntity._id !== currentEntityTemplate?._id
                                                            ? relationship.destinationEntity
                                                            : relationship.sourceEntity;

                                                    const { isEditButtonsDisabled, disabledButtonText, permissionToRelatedTemplate } = getButtonState(
                                                        isEntityDisabled,
                                                        hasWritePermissionToCurrTemplate,
                                                        relatedTemplate,
                                                        currentUser.currentWorkspacePermissions,
                                                    );

                                                    return (
                                                        <ConnectionsTable
                                                            // eslint-disable-next-line react/no-array-index-key
                                                            key={connectedRelationshipTemplateIndex}
                                                            expandedEntity={expandedEntity}
                                                            templateIds={templateIds}
                                                            connectionTemplate={connectionTemplate}
                                                            isEditButtonsDisabled={isEditButtonsDisabled}
                                                            disabledButtonText={disabledButtonText}
                                                            hasPermissionToTemplate={Boolean(permissionToRelatedTemplate) || isAdmin}
                                                        />
                                                    );
                                                })}
                                            </TabPanel>
                                        );
                                    },
                                )}
                            </TabContext>
                        </Grid>
                    </Grid>
                )}
            </Grid>
        </>
    );
};

export default Entity;
