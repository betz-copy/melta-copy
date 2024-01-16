import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Grid, Tab, Typography, useTheme } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import i18next from 'i18next';
import { useTour } from '@reactour/tour';
import { Hive as HiveIcon } from '@mui/icons-material';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../interfaces/relationshipTemplates';
import { EntityDetails } from './components/EntityDetails';
import { ICategoryMap, IMongoCategory } from '../../interfaces/categories';
import { RelationshipTitle } from '../../common/RelationshipTitle';
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
import { getOppositeEntityTemplate, isRelationshipConnectedToEntityTemplate, populateRelationshipTemplate } from '../../utils/templates';
import { CustomIcon } from '../../common/CustomIcon';
import { lightTheme } from '../../theme';
import { canUserWriteInstanceOfCategory } from '../../utils/permissions/instancePermissions';

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
        disabledButtonText = i18next.t('entityPage.createRelationshipPopoverText');
    }

    return { isEditButtonsDisabled, disabledButtonText };
};

const Entity: React.FC = () => {
    const theme = useTheme();

    const [isFiltered, setIsFiltered] = useState(false);
    const { entityId } = useParams();
    const queryClient = useQueryClient();
    const { setDisabledActions, setCurrentStep } = useTour();

    const { instancesPermissions } = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const categories = queryClient.getQueryData<ICategoryMap>('getCategories')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntityExpanded['connections'][number]>>(null);
    const templateIds = Array.from(entityTemplates.keys());

    const { data: expandedEntity } = useQuery(['getExpandedEntity', entityId, { templateIds, numberOfConnections: 1 }], () =>
        getExpandedEntityByIdRequest(entityId!, { templateIds, numberOfConnections: 1 }),
    );

    const [createRelationshipDialogState, setCreateRelationshipDialogState] = useState<{
        isOpen: boolean;
        initialValues?: React.ComponentProps<typeof CreateRelationshipDialog>['initialValues'];
    }>({ isOpen: false });

    const [deleteRelationshipDialogState, setDeleteRelationshipDialogState] = useState<{
        open: boolean;
        connectionToDelete?: IEntityExpanded['connections'][number];
    }>({ open: false });

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
    const relevantRelationshipTemplates = Array.from(relationshipTemplates.values(), (currRelationshipTemplate) =>
        populateRelationshipTemplate(currRelationshipTemplate, entityTemplates),
    ).filter((currRelationshipTemplatePopulated) =>
        isRelationshipConnectedToEntityTemplate(currentEntityTemplate, currRelationshipTemplatePopulated),
    );

    const categoriesWithRelationshipTemplates = Array.from(categories.values(), (category) => {
        return {
            ...category,
            relationshipTemplates: relevantRelationshipTemplates.filter((currRelationshipTemplatePopulated) => {
                const otherEntityTemplate = getOppositeEntityTemplate(currentEntityTemplate._id, currRelationshipTemplatePopulated);

                return otherEntityTemplate.category._id === category._id;
            }),
        } as IMongoCategory & { relationshipTemplates: IMongoRelationshipTemplatePopulated[] };
    }).filter((currCategory) => currCategory.relationshipTemplates?.length > 0);

    const onCreateRelationship = (createdRelationship: IRelationship, sourceEntity: IEntity, destinationEntity: IEntity) => {
        const doesCreatedRelationshipWithCurrEntity = [createdRelationship.sourceEntityId, createdRelationship.destinationEntityId].includes(
            entityId!,
        );

        if (!doesCreatedRelationshipWithCurrEntity) {
            return;
        }
        queryClient.setQueryData<IEntityExpanded>(['getExpandedEntity', entityId, { templateIds, numberOfConnections: 1 }], (prevEntityExpanded) => {
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
        queryClient.setQueryData<IEntityExpanded>(['getExpandedEntity', entityId, { templateIds, numberOfConnections: 1 }], (prevEntityExpanded) => {
            const connections = prevEntityExpanded!.connections.filter(({ relationship }) => relationship.properties._id !== deletedRelationshipId);
            return {
                ...prevEntityExpanded!,
                connections,
            };
        });
    };

    return (
        <>
            <EntityTopBar
                entityTemplate={currentEntityTemplate}
                expandedEntity={expandedEntity}
                relevantRelationshipTemplates={relevantRelationshipTemplates}
                categoriesWithRelationshipTemplates={categoriesWithRelationshipTemplates}
            />
            <Grid className="pageMargin">
                <Grid item marginTop="20px" data-tour="entity-details">
                    <div style={{ marginTop: '20px' }}>
                        <EntityDetails entityTemplate={currentEntityTemplate} expandedEntity={expandedEntity} />
                    </div>
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
                                    {categoriesWithRelationshipTemplates?.map(({ _id, displayName, iconFileId }, index) => (
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
                            {categoriesWithRelationshipTemplates?.map(({ _id, relationshipTemplates: connectedRelationshipTemplates }, index) => {
                                const permissionToRelatedCategory = instancesPermissions.find((instance) => instance.category === _id);

                                const { isEditButtonsDisabled, disabledButtonText } = getButtonState(
                                    isEntityDisabled,
                                    hasWritePermissionToCurrCategory,
                                    permissionToRelatedCategory,
                                );
                                return (
                                    <TabPanel key={_id} value={String(index)} sx={{ padding: 0 }}>
                                        {connectedRelationshipTemplates?.map((currRelationshipTemplate) => {
                                            return (
                                                <Grid key={currRelationshipTemplate._id}>
                                                    <Grid container item justifyContent="space-between" marginBottom="10px">
                                                        <Grid item container marginTop="10px" width="fit-content">
                                                            <RelationshipTitle
                                                                relationshipTemplate={currRelationshipTemplate}
                                                                style={{ padding: '5px 20px' }}
                                                            />
                                                        </Grid>

                                                        <Grid item container justifyContent="space-between" alignItems="center">
                                                            <ResetFilterButton entitiesTableRef={entitiesTableRef} disableButton={!isFiltered} />
                                                            <IconButtonWithPopover
                                                                style={{ borderRadius: '10px' }}
                                                                popoverText={
                                                                    isEditButtonsDisabled
                                                                        ? disabledButtonText
                                                                        : i18next.t('entityPage.createRelationshipPopoverText')
                                                                }
                                                                disabled={isEditButtonsDisabled}
                                                                iconButtonProps={{
                                                                    onClick: () => {
                                                                        setCreateRelationshipDialogState({
                                                                            isOpen: true,
                                                                            initialValues: {
                                                                                relationshipTemplate: currRelationshipTemplate,
                                                                                sourceEntity:
                                                                                    currentEntityTemplate._id ===
                                                                                    currRelationshipTemplate.sourceEntity._id
                                                                                        ? expandedEntity.entity
                                                                                        : null,
                                                                                destinationEntity:
                                                                                    currentEntityTemplate._id ===
                                                                                    currRelationshipTemplate.destinationEntity._id
                                                                                        ? expandedEntity.entity
                                                                                        : null,
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
                                                            template={getOppositeEntityTemplate(currentEntityTemplate._id, currRelationshipTemplate)}
                                                            showNavigateToRowButton
                                                            deleteRowButtonProps={{
                                                                popoverText: isEditButtonsDisabled
                                                                    ? disabledButtonText
                                                                    : i18next.t('entityPage.deleteRelationshipPopoverText'),
                                                                onClick: (connectionToDelete) => {
                                                                    setDeleteRelationshipDialogState({ open: true, connectionToDelete });
                                                                },
                                                                disabledButton: isEditButtonsDisabled,
                                                            }}
                                                            getRowId={(connection) => {
                                                                return connection.relationship.properties._id;
                                                            }}
                                                            getEntityPropertiesData={(connection) => {
                                                                if (currentEntityTemplate._id === connection.destinationEntity.templateId)
                                                                    return connection.sourceEntity.properties;
                                                                return connection.destinationEntity.properties;
                                                            }}
                                                            rowModelType="clientSide"
                                                            rowData={expandedEntity.connections.filter(
                                                                (connection) => connection.relationship.templateId === currRelationshipTemplate._id,
                                                            )}
                                                            rowHeight={50}
                                                            fontSize="16px"
                                                            saveStorageProps={{
                                                                shouldSaveFilter: false,
                                                                shouldSaveWidth: false,
                                                                shouldSaveVisibleColumns: false,
                                                                shouldSaveSorting: false,
                                                                shouldSaveColumnOrder: false,
                                                                shouldSavePagination: false,
                                                                pageType: `entity-${entityId}`,
                                                            }}
                                                            onFilter={() => setIsFiltered(entitiesTableRef.current?.isFiltered() ?? false)}
                                                            hasPermissionToCategory={Boolean(permissionToRelatedCategory)}
                                                        />
                                                    </Box>
                                                </Grid>
                                            );
                                        })}
                                    </TabPanel>
                                );
                            })}
                        </TabContext>
                    </Grid>
                </Grid>
            </Grid>
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
        </>
    );
};

export default Entity;
