import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Box, CircularProgress, Grid, Tab, Typography, useTheme } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import i18next from 'i18next';
import { useTour } from '@reactour/tour';
import { Hive as HiveIcon } from '@mui/icons-material';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import { EntityDetails } from './components/EntityDetails';
import { ICategoryMap } from '../../interfaces/categories';
import { EntityTemplateTextComponent, RelationshipTitle } from '../../common/RelationshipTitle';
import CreateRelationshipDialog from '../../common/dialogs/createRelationshipDialog';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import { IRelationship } from '../../interfaces/relationships';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../common/EntitiesTableOfTemplate';
import DeleteRelationshipDialog from './DeleteRelationshipDialog';
import { IPermissionsOfUser } from '../../services/permissionsService';
import '../../css/pages.css';
import IconButtonWithPopover from '../../common/IconButtonWithPopover';
import { BlueTitle } from '../../common/BlueTitle';
import { ResetFilterButton } from '../../common/EntitiesPage/ResetFilterButton';
import { EntityTopBar } from './components/TopBar';
import { populateRelationshipTemplate } from '../../utils/templates';
import { CustomIcon } from '../../common/CustomIcon';
import { canUserWriteInstanceOfCategory } from '../../utils/permissions/instancePermissions';
import { EntityLink } from '../../common/EntityLink';

export const getButtonState = (
    isEntityDisabled: boolean,
    hasWritePermissionToCurrCategory: boolean,
    permissionToRelatedCategory?: IPermissionsOfUser['instancesPermissions'][number],
) => {
    let isEditButtonsDisabled = false;
    let disabledButtonText = '';

    if (isEntityDisabled) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('entityPage.disabledEntity');
    } else if (!hasWritePermissionToCurrCategory) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHaveWritePermissions');
    } else if (!permissionToRelatedCategory) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHavePermissionsToCategory');
    } else if (permissionToRelatedCategory && !permissionToRelatedCategory.scopes.includes('Write')) {
        isEditButtonsDisabled = true;
        disabledButtonText = i18next.t('permissions.dontHaveWritePermissionsToCategory');
    } else {
        disabledButtonText = i18next.t('ruleManagement.create-relationship');
    }

    return { isEditButtonsDisabled, disabledButtonText };
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

    const [isFiltered, setIsFiltered] = useState(false);
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntityExpanded['connections'][number]>>(null);

    const [createRelationshipDialogState, setCreateRelationshipDialogState] = useState<{
        isOpen: boolean;
        initialValues?: React.ComponentProps<typeof CreateRelationshipDialog>['initialValues'];
    }>({ isOpen: false });

    const [deleteRelationshipDialogState, setDeleteRelationshipDialogState] = useState<{
        open: boolean;
        connectionToDelete?: IEntityExpanded['connections'][number];
    }>({ open: false });

    const onCreateRelationship = (createdRelationship: IRelationship, sourceEntity: IEntity, destinationEntity: IEntity) => {
        const doesCreatedRelationshipWithCurrEntity = [createdRelationship.sourceEntityId, createdRelationship.destinationEntityId].includes(
            expandedEntity.entity.properties._id!,
        );

        if (!doesCreatedRelationshipWithCurrEntity) {
            return;
        }
        queryClient.setQueryData<IEntityExpanded>(
            ['getExpandedEntity', expandedEntity.entity.properties._id, { templateIds, numberOfConnections: 1 }],
            (prevEntityExpanded) => {
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
            },
        );
    };

    const onDeleteRelationship = (deletedRelationshipId: string) => {
        queryClient.setQueryData<IEntityExpanded>(
            ['getExpandedEntity', expandedEntity.entity.properties._id, { templateIds, numberOfConnections: 1 }],
            (prevEntityExpanded) => {
                const connections = prevEntityExpanded!.connections.filter(
                    ({ relationship }) => relationship.properties._id !== deletedRelationshipId,
                );
                return {
                    ...prevEntityExpanded!,
                    connections,
                };
            },
        );
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
                    <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={!isFiltered} />
                    <IconButtonWithPopover
                        style={{ borderRadius: '10px' }}
                        popoverText={isEditButtonsDisabled ? disabledButtonText : i18next.t('ruleManagement.create-relationship')}
                        disabled={isEditButtonsDisabled}
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
                        <img src="/icons/add-relation-icon.svg" />
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
                    template={isExpandedEntityRelationshipSource ? relationshipTemplate.sourceEntity : relationshipTemplate.destinationEntity}
                    showNavigateToRowButton
                    deleteRowButtonProps={{
                        popoverText: isEditButtonsDisabled ? disabledButtonText : i18next.t('entityPage.deleteRelationshipPopoverText'),
                        onClick: (connectionToDelete) => {
                            setDeleteRelationshipDialogState({ open: true, connectionToDelete });
                        },
                        disabledButton: isEditButtonsDisabled,
                    }}
                    getRowId={(connection) => {
                        return connection.relationship.properties._id;
                    }}
                    getEntityPropertiesData={(connection) => {
                        if (expandedEntity.entity.properties._id === connection.destinationEntity.properties._id)
                            return connection.sourceEntity.properties;
                        return connection.destinationEntity.properties;
                    }}
                    rowModelType="clientSide"
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
                    rowHeight={50}
                    fontSize="16px"
                    saveStorageProps={{
                        shouldSaveFilter: false,
                        shouldSaveWidth: false,
                        shouldSaveVisibleColumns: false,
                        shouldSaveSorting: false,
                        shouldSaveColumnOrder: false,
                        shouldSavePagination: false,
                        pageType: `entity-${expandedEntity.entity.properties._id}`,
                    }}
                    onFilter={() => setIsFiltered(entitiesTableRef.current?.isFiltered() ?? false)}
                    hasPermissionToCategory={hasPermissionToCategory}
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

    const { instancesPermissions } = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const templateIds = Array.from(entityTemplates.keys());

    const { data: expandedEntity } = useQuery(['getExpandedEntity', entityId, { templateIds, numberOfConnections: 1 }], () =>
        getExpandedEntityByIdRequest(entityId!, { templateIds, numberOfConnections: 1 }),
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

    const hasWritePermissionToCurrCategory = canUserWriteInstanceOfCategory(instancesPermissions, currentEntityTemplate.category);
    const populatedRelationshipTemplates = Array.from(relationshipTemplates.values(), (currRelationshipTemplate) =>
        populateRelationshipTemplate(currRelationshipTemplate, entityTemplates),
    );
    const connectionsTemplates: IConnectionTemplateOfExpandedEntity[] = [];

    populatedRelationshipTemplates.forEach((relationshipTemplate) => {
        if (relationshipTemplate.sourceEntity._id === currentEntityTemplate._id) {
            connectionsTemplates.push({ relationshipTemplate, isExpandedEntityRelationshipSource: true });
        }
        if (relationshipTemplate.destinationEntity._id === currentEntityTemplate._id) {
            connectionsTemplates.push({ relationshipTemplate, isExpandedEntityRelationshipSource: false });
        }
    });

    const categoriesWithConnectionsTemplates = Array.from(categories.values(), (category) => {
        return {
            category,
            connectionsTemplates: connectionsTemplates.filter(({ relationshipTemplate, isExpandedEntityRelationshipSource }) => {
                const otherEntityTemplate = isExpandedEntityRelationshipSource
                    ? relationshipTemplate.sourceEntity
                    : relationshipTemplate.destinationEntity;
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
                                            style={{ display: 'flex', flexDirection: 'row', gap: '15px', height: '20px', alignItems: 'center' }}
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
                                    const permissionToRelatedCategory = instancesPermissions.find((instance) => instance.category === _id);

                                    const { isEditButtonsDisabled, disabledButtonText } = getButtonState(
                                        isEntityDisabled,
                                        hasWritePermissionToCurrCategory,
                                        permissionToRelatedCategory,
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
