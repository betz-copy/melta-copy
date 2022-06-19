import React, { useEffect, useState } from 'react';
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
import EntitiesTableOfTemplate from '../../common/EntitiesTableOfTemplate';
import { AreYouSureDialog } from '../../common/dialogs/AreYouSureDialog';
import { IPermissionsOfUser } from '../../services/permissionsService';

import '../../css/pages.css';
import IconButtonWithPopoverText from '../../common/IconButtonWithPopover';
import { BlueTitle } from '../../common/BlueTitle';

const Entity: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    const params = useParams();
    const queryClient = useQueryClient();
    const { entityId } = params;

    const { data: expandedEntity } = useQuery(['getExpandedEntity', entityId], () => getExpandedEntityByIdRequest(entityId!));

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

    let currentEntityTemplate;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (titleUpdated || !currentEntityTemplate) return;

        setTitle(currentEntityTemplate.category.displayName);
        setTitleUpdated(true);
    });

    if (!expandedEntity) return <CircularProgress />;

    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    currentEntityTemplate = entityTemplates.find((currTemplate) => currTemplate._id === expandedEntity?.entity.templateId);
    const relevantRelationshipTemplates = queryClient
        .getQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates')!
        .filter(
            (currTemplate) =>
                currTemplate.sourceEntityId === expandedEntity?.entity.templateId ||
                currTemplate.destinationEntityId === expandedEntity?.entity.templateId,
        );

    if (!currentEntityTemplate) return <div>error</div>;

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
            const otherEntity = entityId !== sourceEntity.properties._id ? sourceEntity : destinationEntity;

            return {
                ...prevEntityExpanded!,
                connections: [
                    ...prevEntityExpanded!.connections,
                    {
                        entity: otherEntity,
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
                        const disabled = Boolean(!myPermissions.instancesPermissions.find((instance) => instance.category === _id));
                        return (
                            <TabPanel key={_id} value={String(index)} sx={{ padding: 0 }}>
                                {relationshipTemplates?.map((currRelationshipTemplate) => {
                                    return (
                                        <Grid key={currRelationshipTemplate._id}>
                                            <Grid container item justifyContent="space-between">
                                                <Grid item xs={3.5}>
                                                    <RelationshipTitle
                                                        sourceEntityTemplateDisplayName={currRelationshipTemplate.sourceEntity.displayName}
                                                        relationshipTemplateDisplayName={currRelationshipTemplate.displayName}
                                                        destinationEntityTemplateDisplayName={currRelationshipTemplate.destinationEntity.displayName}
                                                    />
                                                </Grid>
                                                <Grid item>
                                                    <IconButtonWithPopoverText
                                                        popoverText={i18next.t('permissions.dontHavePermissionsToCategory')}
                                                        disabledToolTip={!disabled}
                                                        iconButtonProps={{
                                                            disabled,
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
                                                        <AddCircle
                                                            color={
                                                                !myPermissions.instancesPermissions.find((instance) => instance.category === _id)
                                                                    ? 'disabled'
                                                                    : 'primary'
                                                            }
                                                            fontSize="large"
                                                        />
                                                    </IconButtonWithPopoverText>
                                                </Grid>
                                            </Grid>
                                            <EntitiesTableOfTemplate
                                                template={currRelationshipTemplate.otherEntityTemplate}
                                                showNavigateToRowButton
                                                deleteRowButtonProps={{
                                                    popoverText: disabled
                                                        ? i18next.t('permissions.dontHavePermissionsToCategory')
                                                        : i18next.t('entityPage.deleteRelationshipPopoverText'),
                                                    onClick: (connectionToDelete) => {
                                                        setDeleteRelationshipDialogState({ open: true, connectionToDelete });
                                                    },
                                                    disabled,
                                                }}
                                                disabledEntity={disabled}
                                                getRowId={(connection) => {
                                                    return connection.relationship.properties._id;
                                                }}
                                                getEntityPropertiesData={(connection) => connection.entity.properties}
                                                rowModelType="clientSide"
                                                rowData={expandedEntity.connections.filter(
                                                    (connection) => connection.relationship.templateId === currRelationshipTemplate._id,
                                                )}
                                                rowHeight={50}
                                                fontSize="16px"
                                                minColumnWidth={200}
                                            />
                                        </Grid>
                                    );
                                })}
                            </TabPanel>
                        );
                    })}
                </TabContext>
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
        </Grid>
    );
};

export default Entity;
