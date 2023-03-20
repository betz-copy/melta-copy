import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Grid, Tab } from '@mui/material';
import { useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { AddCircle } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import i18next from 'i18next';
import { useTour } from '@reactour/tour';
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
import IconButtonWithPopoverText from '../../common/IconButtonWithPopover';
import { BlueTitle } from '../../common/BlueTitle';
import { ResetFilterButton } from '../../common/EntitiesPage/ResetFilterButton';
import { EntityTopBar } from './components/TopBar';
import { getOppositeEntityTemplate, isRelationshipConnectedToEntityTemplate, populateRelationshipTemplate } from '../../utils/templates';

const Entity: React.FC = () => {
    const params = useParams();
    const queryClient = useQueryClient();
    const { entityId } = params;
    const { setDisabledActions, setCurrentStep } = useTour();

    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

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
                    <EntityDetails entityTemplate={currentEntityTemplate} expandedEntity={expandedEntity} />
                </Grid>

                <Grid data-tour="connected-entities">
                    <BlueTitle title={i18next.t('entityPage.relationshipTitle')} component="h5" variant="h5" style={{ marginTop: '2rem' }} />
                    <Grid item>
                        <TabContext value={value}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <TabList onChange={(_event, newValue) => setValue(newValue)}>
                                    {categoriesWithRelationshipTemplates?.map(({ _id, displayName }, index) => (
                                        <Tab key={_id} label={displayName} value={String(index)} />
                                    ))}
                                </TabList>
                            </Box>
                            {categoriesWithRelationshipTemplates?.map(({ _id, relationshipTemplates: connectedRelationshipTemplates }, index) => {
                                const hasPermissionToCategory = Boolean(
                                    myPermissions.instancesPermissions.find((instance) => instance.category === _id),
                                );
                                const canCreateRelationship = hasPermissionToCategory && !isEntityDisabled;

                                return (
                                    <TabPanel key={_id} value={String(index)} sx={{ padding: 0 }}>
                                        {connectedRelationshipTemplates?.map((currRelationshipTemplate) => {
                                            return (
                                                <Grid key={currRelationshipTemplate._id}>
                                                    <Grid container item justifyContent="space-between" marginBottom="10px">
                                                        <Grid item marginTop="10px">
                                                            <RelationshipTitle
                                                                sourceEntityTemplateDisplayName={currRelationshipTemplate.sourceEntity.displayName}
                                                                relationshipTemplateDisplayName={currRelationshipTemplate.displayName}
                                                                destinationEntityTemplateDisplayName={
                                                                    currRelationshipTemplate.destinationEntity.displayName
                                                                }
                                                            />
                                                        </Grid>

                                                        <Grid item>
                                                            <ResetFilterButton entitiesTableRef={entitiesTableRef} />
                                                            <IconButtonWithPopoverText
                                                                popoverText={
                                                                    hasPermissionToCategory
                                                                        ? i18next.t('entityPage.disabledEntity')
                                                                        : i18next.t('permissions.dontHavePermissionsToCategory')
                                                                }
                                                                disabledToolTip={canCreateRelationship}
                                                                iconButtonProps={{
                                                                    disabled: !hasPermissionToCategory || isEntityDisabled,
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
                                                                <AddCircle
                                                                    color={canCreateRelationship ? 'primary' : 'disabled'}
                                                                    fontSize="large"
                                                                    data-tour="create-relationship"
                                                                />
                                                            </IconButtonWithPopoverText>
                                                        </Grid>
                                                    </Grid>
                                                    <Box sx={{ marginBottom: '30px', width: '100%' }}>
                                                        <EntitiesTableOfTemplate
                                                            ref={entitiesTableRef}
                                                            template={getOppositeEntityTemplate(currentEntityTemplate._id, currRelationshipTemplate)}
                                                            showNavigateToRowButton
                                                            deleteRowButtonProps={{
                                                                popoverText: hasPermissionToCategory
                                                                    ? i18next.t('entityPage.deleteRelationshipPopoverText')
                                                                    : i18next.t('permissions.dontHavePermissionsToCategory'),
                                                                onClick: (connectionToDelete) => {
                                                                    setDeleteRelationshipDialogState({ open: true, connectionToDelete });
                                                                },
                                                                disabled: !hasPermissionToCategory,
                                                            }}
                                                            disabledEntity={!hasPermissionToCategory}
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
                                                            minColumnWidth={200}
                                                            filterStorageProps={{ shouldSaveFilter: true, pageType: `entity-${entityId}` }}
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
