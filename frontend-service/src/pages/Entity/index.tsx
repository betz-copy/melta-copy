import React, { useEffect, useState, useRef } from 'react';
import { Box, CircularProgress, Grid, Tab } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { AddCircle } from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import { IMongoRelationshipTemplate, IMongoRelationshipTemplatePopulated } from '../../interfaces/relationshipTemplates';
import { EntityDetails } from './components/EntityDetails';
import { IMongoCategory } from '../../interfaces/categories';
import { RelationshipTitle } from '../../common/RelationshipTitle';
import CreateRelationshipDialog from '../../common/dialogs/createRelationshipDialog';
import { IEntity, IEntityExpanded } from '../../interfaces/entities';
import { IRelationship } from '../../interfaces/relationships';
import { deleteRelationshipRequest } from '../../services/relationshipsService';
import EntitiesTableOfTemplate, { EntitiesTableOfTemplateRef } from '../../common/EntitiesTableOfTemplate';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { IPermissionsOfUser } from '../../services/permissionsService';

import '../../css/pages.css';
import IconButtonWithPopoverText from '../../common/IconButtonWithPopover';
import { BlueTitle } from '../../common/BlueTitle';
import { ResetFilterButton } from '../../common/TemplatesTablesPage/ResetFilterButton';
import { EntityTopBar } from './components/TopBar';

const Entity: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const params = useParams();
    const queryClient = useQueryClient();
    const { entityId } = params;
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef>(null);
    const templateIds = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!.map((entityTemplate) => entityTemplate._id);

    const { data: expandedEntity } = useQuery(['getExpandedEntity', entityId, { templateIds, numberOfConnections: 1 }], () =>
        getExpandedEntityByIdRequest(entityId!, { templateIds, numberOfConnections: 1 }),
    );

    const isEntityDisabled = expandedEntity?.entity.properties.disabled;

    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!;
    const myPermissions = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;

    const [createRelationshipDialogState, setCreateRelationshipDialogState] = useState<{
        isOpen: boolean;
        initialValues?: React.ComponentProps<typeof CreateRelationshipDialog>['initialValues'];
    }>({ isOpen: false });

    const [deleteRelationshipDialogState, setDeleteRelationshipDialogState] = useState<{
        open: boolean;
        connectionToDelete?: IEntityExpanded['connections'][number];
    }>({ open: false });

    const { mutateAsync: deleteRelationship, isLoading: isLoadingDeleteRelationship } = useMutation(deleteRelationshipRequest, {
        onError: (error) => {
            // eslint-disable-next-line no-console
            console.log('failed to delete relationship. error:', error);
            toast.error(i18next.t('entityPage.failedToDeleteRelationship'));
            setDeleteRelationshipDialogState({ open: false });
        },
        onSuccess: (_deletedRelationship, deletedRelationshipId) => {
            queryClient.setQueryData<IEntityExpanded>(['getExpandedEntity', entityId], (prevEntityExpanded) => {
                const connections = prevEntityExpanded!.connections.filter(
                    ({ relationship }) => relationship.properties._id !== deletedRelationshipId,
                );
                return {
                    ...prevEntityExpanded!,
                    connections,
                };
            });
            setDeleteRelationshipDialogState({ open: false });
        },
    });

    const [value, setValue] = useState('0');
    const [titleUpdated, setTitleUpdated] = useState(false);

    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const currentEntityTemplate: IMongoEntityTemplatePopulated = entityTemplates.find(
        (currTemplate) => currTemplate._id === expandedEntity?.entity.templateId,
    )!;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (titleUpdated || !currentEntityTemplate) return;

        setTitle('');
        setTitleUpdated(true);
    });

    if (!expandedEntity) return <CircularProgress />;

    const relevantRelationshipTemplates = queryClient
        .getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!
        .filter(
            (currTemplate) =>
                currTemplate.sourceEntityId === expandedEntity?.entity.templateId ||
                currTemplate.destinationEntityId === expandedEntity?.entity.templateId,
        );

    const categoriesWithRelationshipTemplates = categories
        .map((category) => {
            return {
                ...category,
                relationshipTemplates:
                    relevantRelationshipTemplates
                        .map((currRelationshipTemplate) => {
                            const sourceEntity = entityTemplates.find(
                                (currEntityTemplate) => currEntityTemplate._id === currRelationshipTemplate.sourceEntityId,
                            )!;
                            const destinationEntity = entityTemplates.find(
                                (currEntityTemplate) => currEntityTemplate._id === currRelationshipTemplate.destinationEntityId,
                            )!;

                            const otherEntityTemplate = sourceEntity._id === currentEntityTemplate._id ? destinationEntity : sourceEntity;

                            return {
                                _id: currRelationshipTemplate._id,
                                name: currRelationshipTemplate.name,
                                displayName: currRelationshipTemplate.displayName,
                                sourceEntity,
                                destinationEntity,
                                otherEntityTemplate,
                            } as IMongoRelationshipTemplatePopulated & { otherEntityTemplate: IMongoEntityTemplatePopulated };
                        })
                        .filter((currRelationshipTemplate) => currRelationshipTemplate.otherEntityTemplate.category._id === category._id) || [],
            };
        })
        .filter((currCategory) => currCategory.relationshipTemplates?.length > 0);

    const onCreateRelationship = (createdRelationship: IRelationship, sourceEntity: IEntity, destinationEntity: IEntity) => {
        const doesCreatedRelationshipWithCurrEntity = [createdRelationship.sourceEntityId, createdRelationship.destinationEntityId].includes(
            entityId!,
        );

        if (!doesCreatedRelationshipWithCurrEntity) {
            return;
        }
        queryClient.setQueryData<IEntityExpanded>(['getExpandedEntity', entityId], (prevEntityExpanded) => {
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

    return (
        <>
            <EntityTopBar entityId={entityId!} entityTemplate={currentEntityTemplate} />
            <Grid className="pageMargin">
                <Grid item marginTop="20px">
                    <EntityDetails entityTemplate={currentEntityTemplate} expandedEntity={expandedEntity} />
                </Grid>

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
                        {categoriesWithRelationshipTemplates?.map(({ _id, relationshipTemplates }, index) => {
                            const hasPermissionToCategory = Boolean(myPermissions.instancesPermissions.find((instance) => instance.category === _id));
                            const canCreateRelationship = hasPermissionToCategory && !isEntityDisabled;

                            return (
                                <TabPanel key={_id} value={String(index)} sx={{ padding: 0 }}>
                                    {relationshipTemplates?.map((currRelationshipTemplate) => {
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
                                                                    const { otherEntityTemplate, ...relationshipTemplatePopulated } =
                                                                        currRelationshipTemplate;
                                                                    setCreateRelationshipDialogState({
                                                                        isOpen: true,
                                                                        initialValues: {
                                                                            relationshipTemplate: relationshipTemplatePopulated,
                                                                            sourceEntity:
                                                                                currentEntityTemplate._id ===
                                                                                relationshipTemplatePopulated.sourceEntity._id
                                                                                    ? expandedEntity.entity
                                                                                    : null,
                                                                            destinationEntity:
                                                                                currentEntityTemplate._id ===
                                                                                relationshipTemplatePopulated.destinationEntity._id
                                                                                    ? expandedEntity.entity
                                                                                    : null,
                                                                        },
                                                                    });
                                                                },
                                                            }}
                                                        >
                                                            <AddCircle color={canCreateRelationship ? 'primary' : 'disabled'} fontSize="large" />
                                                        </IconButtonWithPopoverText>
                                                    </Grid>
                                                </Grid>
                                                <EntitiesTableOfTemplate
                                                    ref={entitiesTableRef}
                                                    template={currRelationshipTemplate.otherEntityTemplate}
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
                                            </Grid>
                                        );
                                    })}
                                </TabPanel>
                            );
                        })}
                    </TabContext>
                </Grid>
            </Grid>
            <CreateRelationshipDialog
                isOpen={createRelationshipDialogState.isOpen}
                handleClose={() => setCreateRelationshipDialogState({ isOpen: false })}
                onSubmitSuccess={onCreateRelationship}
                initialValues={createRelationshipDialogState.initialValues}
            />
            <AreYouSureDialog
                open={deleteRelationshipDialogState.open}
                handleClose={() => setDeleteRelationshipDialogState({ open: false })}
                onYes={async () => deleteRelationship(deleteRelationshipDialogState.connectionToDelete!.relationship.properties._id)}
                isLoading={isLoadingDeleteRelationship}
            />
        </>
    );
};

export default Entity;
