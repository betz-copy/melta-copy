import { Hive as HiveIcon } from '@mui/icons-material';
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
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import { EntityTemplateTextComponent, RelationshipTitle } from '../../common/RelationshipTitle';
import '../../css/pages.css';
import { environment } from '../../globals';
import { ICategoryMap } from '../../interfaces/categories';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { PermissionScope } from '../../interfaces/permissions';
import { ISubCompactPermissions } from '../../interfaces/permissions/permissions';
import { IRelationship } from '../../interfaces/relationships';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { useUserStore } from '../../stores/user';
import { checkUserCategoryPermission } from '../../utils/permissions/instancePermissions';
import { populateRelationshipTemplate } from '../../utils/templates';
import { EntityDetails } from './components/EntityDetails';
import { EntityTopBar } from './components/TopBar';
import DeleteRelationshipDialog from './DeleteRelationshipDialog';

const { defaultRowHeight, defaultFontSize } = environment.agGrid;

export const getButtonState = (
    isEntityDisabled: boolean,
    hasWritePermissionToCurrCategory: boolean,
    categoryId: string,
    permissions?: ISubCompactPermissions,
) => {
    let isEditButtonsDisabled = false;
    let disabledButtonText = '';

    const permissionToRelatedCategory = permissions?.instances?.categories[categoryId];

    if (isEntityDisabled) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('entityPage.disabledEntity');
    } else if (!hasWritePermissionToCurrCategory) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHaveWritePermissions');
    } else if (!permissions?.admin && !permissions?.instances) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHavePermissionsToCategory');
    } else if (!permissions?.admin && permissionToRelatedCategory?.scope !== PermissionScope.write) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHaveWritePermissionsToCategory');
    } else {
        disabledButtonText = i18next.t('ruleManagement.create-relationship');
    }

    return { isEditButtonsDisabled, disabledButtonText, permissionToRelatedCategory };
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

const ConnectionsTable: React.FC<{
    expandedEntity: IEntityExpanded;
    connectionTemplate: IConnectionTemplateOfExpandedEntity;
    templateIds: string[];
    isEditButtonsDisabled: boolean;
    disabledButtonText: string;
    hasPermissionToCategory: boolean;
}> = ({
    expandedEntity,
    connectionTemplate: { relationshipTemplate, isExpandedEntityRelationshipSource },
    templateIds,
    isEditButtonsDisabled,
    disabledButtonText,
    hasPermissionToCategory,
}) => {
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
                        <IconButtonWithPopover
                            popoverText={i18next.t('entitiesTableOfTemplate.columns')}
                            iconButtonProps={{ onClick: () => entitiesTableRef.current?.showSideBar() }}
                            style={{ borderRadius: '5px' }}
                        >
                            <img src="/icons/columns-settings.svg" />
                        </IconButtonWithPopover>
                        <IconButtonWithPopover
                            popoverText={isExpand ? i18next.t('entitiesTableOfTemplate.expandLess') : i18next.t('entitiesTableOfTemplate.expandMore')}
                            iconButtonProps={{
                                onClick: () => {
                                    setIsExpand(!isExpand);
                                },
                                size: 'small',
                            }}
                            style={{ borderRadius: '5px' }}
                        >
                            {isExpand ? <img src="/icons/reduce-table.svg" /> : <img src="/icons/expans-table.svg" />}
                        </IconButtonWithPopover>
                        <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={!isFiltered} />
                    </Grid>
                    <IconButtonWithPopover
                        style={{ borderRadius: '10px' }}
                        popoverText={
                            isEditButtonsDisabled
                                ? disabledButtonText
                                : i18next.t(`ruleManagement.${relationshipTemplate.isProperty ? 'cant-' : ''}create-relationship`)
                        }
                        disabled={isEditButtonsDisabled || relationshipTemplate.isProperty}
                        iconButtonProps={{
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
                        }}
                    >
                        <img
                            src={
                                isEditButtonsDisabled || relationshipTemplate.isProperty
                                    ? '/icons/add-relation-icon-disabled.svg'
                                    : '/icons/add-relation-icon.svg'
                            }
                        />
                    </IconButtonWithPopover>
                </Grid>
            </Grid>
            <Box
                sx={{
                    marginBottom: '30px',
                    width: '100%',
                }}
            >
                <EntitiesTableOfTemplate
                    ref={entitiesTableRef}
                    template={isExpandedEntityRelationshipSource ? relationshipTemplate.destinationEntity : relationshipTemplate.sourceEntity}
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
                    getEntityPropertiesData={(
                        connection:
                            | IEntity
                            | {
                                  relationship: Pick<IRelationship, 'properties' | 'templateId'>;
                                  sourceEntity: IEntity;
                                  destinationEntity: IEntity;
                              },
                    ) => {
                        if ('relationship' in connection) {
                            if (expandedEntity.entity.properties._id === connection.destinationEntity.properties._id) {
                                return connection.sourceEntity.properties;
                            }
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
                        shouldSaveColumnOrder: false,
                        shouldSavePagination: false,
                        shouldSaveScrollPosition: false,
                        pageType: `entity-${expandedEntity.entity.properties._id}`,
                    }}
                    onFilter={() => setIsFiltered(entitiesTableRef.current?.isFiltered() ?? false)}
                    hasPermissionToCategory={hasPermissionToCategory}
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
}

const Entity: React.FC = () => {
    const theme = useTheme();

    const { entityId } = useParams();
    const queryClient = useQueryClient();
    const { setDisabledActions, setCurrentStep } = useTour();

    const currentUser = useUserStore((state) => state.user);

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const templateIds = Array.from(entityTemplates.keys());

    const expanded = entityId ? { [entityId]: 1 } : {};
    const { data: expandedEntity } = useQuery(['getExpandedEntity', entityId, expanded, { templateIds }], () =>
        getExpandedEntityByIdRequest(entityId!, expanded, { templateIds }),
    );

    const [value, setValue] = useState('0');

    useEffect(() => {
        if (!expandedEntity) return;

        setCurrentStep((currStep) => currStep + 1);
        setDisabledActions(false);
    }, [expandedEntity]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!expandedEntity) return <CircularProgress />;

    const isEntityDisabled = expandedEntity.entity.properties.disabled;
    const currentEntityTemplate = entityTemplates.get(expandedEntity.entity.templateId)!;

    const hasWritePermissionToCurrCategory = checkUserCategoryPermission(
        currentUser.currentWorkspacePermissions,
        currentEntityTemplate.category,
        PermissionScope.write,
    );
    const populatedRelationshipTemplates = Array.from(relationshipTemplates.values(), (currRelationshipTemplate) =>
        populateRelationshipTemplate(currRelationshipTemplate, entityTemplates),
    );
    const connectionsTemplates: IConnectionTemplateOfExpandedEntity[] = [];

    populatedRelationshipTemplates.forEach((relationshipTemplate) => {
        if (
            !(
                relationshipTemplate.isProperty &&
                currentEntityTemplate.properties.properties[relationshipTemplate.name]?.relationshipReference?.relationshipTemplateId ===
                    relationshipTemplate._id
            )
        ) {
            if (relationshipTemplate.sourceEntity._id === currentEntityTemplate._id) {
                connectionsTemplates.push({ relationshipTemplate, isExpandedEntityRelationshipSource: true });
            }
            if (relationshipTemplate.destinationEntity._id === currentEntityTemplate._id) {
                connectionsTemplates.push({ relationshipTemplate, isExpandedEntityRelationshipSource: false });
            }
        }
    });

    const categoriesWithConnectionsTemplates = Array.from(categories.values(), (category) => {
        return {
            category,
            connectionsTemplates: connectionsTemplates.filter(({ relationshipTemplate, isExpandedEntityRelationshipSource }) => {
                const otherEntityTemplate = isExpandedEntityRelationshipSource
                    ? relationshipTemplate.destinationEntity
                    : relationshipTemplate.sourceEntity;
                return otherEntityTemplate.category._id === category._id;
            }),
        };
    }).filter((currCategory) => currCategory.connectionsTemplates?.length > 0);

    return (
        <>
            <EntityTopBar
                entityTemplate={currentEntityTemplate}
                expandedEntity={expandedEntity}
                connectionsTemplates={connectionsTemplates}
                categoriesWithConnectionsTemplates={categoriesWithConnectionsTemplates}
            />
            <Grid className="pageMargin">
                <Grid item marginTop="20px" data-tour="entity-details">
                    <EntityDetails entityTemplate={currentEntityTemplate} expandedEntity={expandedEntity} />
                </Grid>

                <Grid data-tour="connected-entities" style={{ marginTop: '2rem' }}>
                    <Grid item container xs={5} alignItems="center" gap="20px">
                        <Grid item alignContent="center">
                            <img src="\icons\relations-icon.svg" />
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
                        <TabContext value={value}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList style={{ height: '60px' }} onChange={(_event, newValue) => setValue(newValue)}>
                                    {categoriesWithConnectionsTemplates?.map(({ category: { _id, displayName, iconFileId } }, index) => (
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
                                                        color={value === String(index) ? theme.palette.primary.main : '#787C9E'}
                                                        style={{ fontWeight: '500', fontSize: '16px' }}
                                                    >
                                                        {displayName}
                                                    </Typography>
                                                    <Typography color="#787C9E">
                                                        {
                                                            // calculate the amount of the related connections of each entity
                                                            expandedEntity.connections.filter((connection) => {
                                                                const connectionRelationshipTemplate = relationshipTemplates.get(
                                                                    connection.relationship.templateId,
                                                                )!;

                                                                if (
                                                                    connectionRelationshipTemplate.isProperty &&
                                                                    currentEntityTemplate.properties.properties[connectionRelationshipTemplate.name]
                                                                        ?.relationshipReference?.relationshipTemplateId ===
                                                                        connectionRelationshipTemplate._id
                                                                )
                                                                    return false;

                                                                if (
                                                                    expandedEntity.entity.properties._id ===
                                                                    connection.destinationEntity.properties._id
                                                                )
                                                                    return (
                                                                        entityTemplates.get(connection.sourceEntity.templateId)!.category._id === _id
                                                                    );

                                                                return (
                                                                    entityTemplates.get(connection.destinationEntity.templateId)!.category._id === _id
                                                                );
                                                            }).length
                                                        }
                                                    </Typography>
                                                </Grid>
                                            }
                                            value={String(index)}
                                            icon={
                                                iconFileId ? (
                                                    <CustomIcon
                                                        iconUrl={iconFileId}
                                                        height="24px"
                                                        width="24px"
                                                        color={value === String(index) ? theme.palette.primary.main : '#787C9E'}
                                                    />
                                                ) : (
                                                    <HiveIcon
                                                        fontSize="medium"
                                                        sx={{
                                                            color: value === String(index) ? theme.palette.primary.main : '#787C9E',
                                                        }}
                                                    />
                                                )
                                            }
                                        />
                                    ))}
                                </TabList>
                            </Box>
                            {categoriesWithConnectionsTemplates?.map(
                                ({ category: { _id }, connectionsTemplates: connectionsTemplatesOfCategory }, index) => {
                                    const { isEditButtonsDisabled, disabledButtonText, permissionToRelatedCategory } = getButtonState(
                                        isEntityDisabled,
                                        hasWritePermissionToCurrCategory,
                                        _id,
                                        currentUser.currentWorkspacePermissions,
                                    );

                                    return (
                                        <TabPanel key={_id} value={String(index)}>
                                            {connectionsTemplatesOfCategory.map((connectionTemplate, connectedRelationshipTemplateIndex) => (
                                                <ConnectionsTable
                                                    // eslint-disable-next-line react/no-array-index-key
                                                    key={connectedRelationshipTemplateIndex}
                                                    expandedEntity={expandedEntity}
                                                    templateIds={templateIds}
                                                    connectionTemplate={connectionTemplate}
                                                    isEditButtonsDisabled={isEditButtonsDisabled}
                                                    disabledButtonText={disabledButtonText}
                                                    hasPermissionToCategory={Boolean(permissionToRelatedCategory)}
                                                />
                                            ))}
                                        </TabPanel>
                                    );
                                },
                            )}
                        </TabContext>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};

export default Entity;
