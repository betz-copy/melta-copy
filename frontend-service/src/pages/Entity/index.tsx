import { AddCircle, CloseFullscreenRounded, Expand, TableRowsOutlined, AccountBalanceWallet } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, CircularProgress, Grid, Tab, useTheme } from '@mui/material';
import { useTour } from '@reactour/tour';
import i18next from 'i18next';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useParams, useSearchParams } from 'wouter';
import CreateRelationshipDialog from '../../common/dialogs/createRelationshipDialog';
import { ResetFilterButton } from '../../common/EntitiesPage/ResetFilterButton';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef, IConnection } from '../../common/EntitiesTableOfTemplate';
import { EntityLink } from '../../common/EntityLink';
import { EntityTemplateTextComponent, RelationshipTitle } from '../../common/RelationshipTitle';
import { TableButton } from '../../common/TableButton';
import '../../css/pages.css';
import { getChildTemplatesFilter } from '../../common/inputs/TemplateEntitiesAutocomplete';
import BlueTitle from '../../common/MeltaDesigns/BlueTitle';
import '../../css/pages.css';
import { ICategoryMap } from '../../interfaces/categories';
import { IChildTemplateMap, IChildTemplatePopulated } from '../../interfaces/childTemplates';
import { IEntity, IEntityExpanded, ISearchFilter } from '../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { PermissionScope } from '../../interfaces/permissions';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';
import { IRelationship } from '../../interfaces/relationships';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { useUserStore } from '../../stores/user';
import { useWorkspaceStore } from '../../stores/workspace';
import { checkUserTemplatePermission } from '../../utils/permissions/instancePermissions';
import { getFullRelationshipTemplates, groupChildTemplatesByParent } from '../../utils/templates';
import { EntityDetails } from './components/EntityDetails';
import { EntityTopBar } from './components/TopBar';
import DeleteRelationshipDialog from './DeleteRelationshipDialog';
import { RelationshipIcon } from './RelationshipIcon';
import { EntityConnections } from './entityConnections';
import { WalletTransfers } from './walletTransfers';

export const getButtonState = (
    isEntityDisabled: boolean,
    hasWritePermissionToCurrTemplate: boolean,
    relatedTemplate: IMongoEntityTemplatePopulated,
    groupChildTemplate: Record<string, IChildTemplatePopulated[]>,
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

    return { isEditButtonsDisabled, disabledButtonText, hasPermissionToRelatedTemplate: Boolean(permissions?.admin || permissionToRelatedTemplate) };
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
    groupChildTemplate?: Record<string, IChildTemplatePopulated[]>;
}> = ({
    expandedEntity,
    connectionTemplate: { relationshipTemplate, isExpandedEntityRelationshipSource, hasInstances },
    templateIds,
    isEditButtonsDisabled,
    disabledButtonText,
    hasPermissionToTemplate,
    groupChildTemplate,
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
            { [expandedEntity.entity.properties._id]: { maxLevel: 1 } },
            { templateIds },
        ];

        const template = isExpandedEntityRelationshipSource ? relationshipTemplate.destinationEntity : relationshipTemplate.sourceEntity;

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
                        template={template}
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

export interface INestedRelationshipTemplates {
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    isExpandedEntityRelationshipSource: boolean; // for relationship that is of format currentEntityTemplate -> currentEntityTemplate, we want it twice, once with outgoing connections of expandedEntity, and once with incoming connections of expandedEntity
    hasInstances: boolean;
    depth: number;
    parentRelationship?: IMongoRelationshipTemplatePopulated;
    children: INestedRelationshipTemplates[];
}

const Entity: React.FC = () => {
    const theme = useTheme();
    const { entityId } = useParams();
    const queryClient = useQueryClient();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const currentUser = useUserStore((state) => state.user);
    const { setDisabledActions, setCurrentStep } = useTour();

    const [searchParams, _setSearchParams] = useSearchParams();
    const childTemplateId = searchParams.get('childTemplateId') ?? undefined;

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const templateIds = Array.from(entityTemplates.keys());

    const groupChildTemplate = groupChildTemplatesByParent(childTemplates, entityTemplates);

    const filters: any =
        Object.entries(groupChildTemplate).length > 0
            ? Object.fromEntries(
                Object.entries(groupChildTemplate)
                    .map(([key, children]) => {
                        const childFilter = getChildTemplatesFilter(children, workspace, true, currentUser);
                        if (!childFilter) return null;
                        return [key, { filter: childFilter }] as const;
                    })
                    .filter((f): f is readonly [string, { filter: ISearchFilter }] => f !== null),
            )
            : undefined;

    const expanded = entityId ? { [entityId]: { maxLevel: 1 } } : {};
    const { data: expandedEntity } = useQuery(['getExpandedEntity', entityId, expanded, { templateIds }], () =>
        getExpandedEntityByIdRequest(entityId!, expanded, { templateIds, childTemplateId }, {}, filters),
    );

    const [selectTransfersOrConnections, setSelectTransfersOrConnections] = useState('walletTransfers');
    useEffect(() => {
        if (!expandedEntity) return;

        setCurrentStep((currStep) => currStep + 1);
        setDisabledActions(false);
    }, [expandedEntity]); // eslint-disable-line react-hooks/exhaustive-deps

    const currentEntityTemplate = childTemplateId
        ? childTemplates.get(childTemplateId)!
        : entityTemplates.get(expandedEntity?.entity.templateId ?? '')!;

    const connectionsTemplates = useMemo(() => {
        if (!currentEntityTemplate) return;

        return getFullRelationshipTemplates(
            relationshipTemplates,
            entityTemplates,
            {
                ...currentEntityTemplate,
                _id: childTemplateId ? (currentEntityTemplate as IChildTemplatePopulated).parentTemplate._id : currentEntityTemplate._id,
                displayName: childTemplateId
                    ? (currentEntityTemplate as IChildTemplatePopulated).parentTemplate.displayName
                    : currentEntityTemplate.displayName,
            },
            1,
            undefined,
            expandedEntity,
            groupChildTemplate,
        );
    }, [currentEntityTemplate, expandedEntity]);

    // Early return if data is not ready - must be after all hooks
    if (!expandedEntity || !currentEntityTemplate || !currentEntityTemplate.category) {
        return <CircularProgress />;
    }
    const isWalletTemplate = Object.values(currentEntityTemplate.properties.properties).find((property) => property.accountBalance);

    const isEntityDisabled = !!expandedEntity?.entity.properties.disabled;
    const hasWritePermissionToCurrTemplate = checkUserTemplatePermission(
        currentUser.currentWorkspacePermissions,
        currentEntityTemplate?.category?._id ?? '',
        currentEntityTemplate?._id ?? '',
        PermissionScope.write,
    );

    const getButtonStateByRelatedTemplate = (relatedTemplate: IMongoEntityTemplatePopulated) => {
        const { isEditButtonsDisabled, disabledButtonText, hasPermissionToRelatedTemplate } = getButtonState(
            isEntityDisabled,
            hasWritePermissionToCurrTemplate,
            relatedTemplate,
            groupChildTemplate,
            currentUser.currentWorkspacePermissions,
        );
        return { isEditButtonsDisabled, disabledButtonText, hasPermissionToRelatedTemplate };
    };

    return (
        <>
            <EntityTopBar
                entityTemplate={currentEntityTemplate}
                expandedEntity={expandedEntity}
                connectionsTemplates={(connectionsTemplates ?? []).filter((relTemplate) => relTemplate.hasInstances)}
            />
            <Grid className="pageMargin">
                <Grid marginTop="20px" data-tour="entity-details">
                    <EntityDetails entityTemplate={currentEntityTemplate} expandedEntity={expandedEntity} />
                </Grid>

                <Grid>
                    {!isWalletTemplate ? (
                        <EntityConnections
                            currentEntityTemplate={currentEntityTemplate}
                            expandedEntity={expandedEntity}
                            templateIds={templateIds}
                            connectionsTemplates={connectionsTemplates}
                            getButtonStateByRelatedTemplate={getButtonStateByRelatedTemplate}
                            groupChildTemplate={groupChildTemplate}
                        />
                    ) : (
                        <TabContext value={selectTransfersOrConnections}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <TabList
                                    onChange={(_event, newValue) => setSelectTransfersOrConnections(newValue)}
                                    slotProps={{
                                        indicator: { style: { display: 'none' } },
                                    }} 
                                    sx={{
                                        '& .MuiTab-root': {
                                            minWidth: 'auto',
                                            p: 1,
                                        },
                                        mb: 0,
                                    }}
                                >
                                    <Tab icon={<RelationshipIcon />} value="walletTransfers" />
                                    <Tab icon={<AccountBalanceWallet sx={{ color: theme.palette.primary.main }} />} value="connectionsByCategories" />
                                </TabList>
                            </Box>
                            <TabPanel value="walletTransfers" sx={{ p: 0 }}>
                                <EntityConnections
                                    currentEntityTemplate={currentEntityTemplate}
                                    expandedEntity={expandedEntity}
                                    templateIds={templateIds}
                                    connectionsTemplates={connectionsTemplates}
                                    getButtonStateByRelatedTemplate={getButtonStateByRelatedTemplate}
                                    groupChildTemplate={groupChildTemplate}
                                />
                            </TabPanel>
                            <TabPanel value="connectionsByCategories" sx={{ p: 0 }}>
                                <WalletTransfers
                                    connectionsTemplates={connectionsTemplates}
                                    templateId={currentEntityTemplate._id}
                                    expandedEntity={expandedEntity}
                                    getButtonStateByRelatedTemplate={getButtonStateByRelatedTemplate}
                                />
                            </TabPanel>
                        </TabContext>
                    )}
                </Grid>
            </Grid >
        </>
    );
};

export default Entity;
