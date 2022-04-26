import React, { useState } from 'react';
import { Grid, Card, CardContent, IconButton, CircularProgress } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Done as DoneIcon, AccountTreeOutlined as GraphIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { MuiForm5 as Form } from '@rjsf/material-ui';
import { useNavigate } from 'react-router-dom';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity, IEntityExpanded } from '../../../interfaces/entities';
import { updateEntityRequest, deleteEntityRequest } from '../../../services/entitiesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { EntityProperties } from '../../../common/EntityProperties';

const EntityDetails: React.FC<{ entityTemplate: IMongoEntityTemplatePopulated; expandedEntity: IEntityExpanded }> = ({
    entityTemplate,
    expandedEntity,
}) => {
    const { entity } = expandedEntity;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditMode, setIsEditMode] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [updateValues, setUpdateValues] = useState(entity.properties);

    const closeDeleteDialog = () => {
        setOpenDeleteDialog(false);
    };

    const { isLoading: isDeleteLoading, mutateAsync: deleteMutation } = useMutation(() => deleteEntityRequest(entity.properties._id), {
        onError: () => {
            closeDeleteDialog();
        },
        onSuccess: () => {
            toast.success(i18next.t('wizard.entity.deletedSuccessfully'));
            closeDeleteDialog();
        },
    });

    const { isLoading: isUpdateLoading, mutateAsync: updateMutation } = useMutation(
        (newEntityDate: IEntity) => updateEntityRequest(entity.properties._id, newEntityDate),
        {
            onSuccess: (data) => {
                queryClient.setQueryData(['getExpandedEntity', entity.properties._id], () => {
                    return {
                        ...expandedEntity,
                        entity: data,
                    };
                });

                toast.success(i18next.t('wizard.entity.editedSuccefully'));
                setIsEditMode(false);
            },
            onError: () => {
                toast.error(i18next.t('wizard.entity.failedToEdit'));
            },
        },
    );

    return (
        <Card>
            <CardContent>
                <Grid container justifyContent="space-between" alignItems="center">
                    {isEditMode ? (
                        <Form
                            schema={entityTemplate.properties}
                            formData={updateValues}
                            onChange={({ formData }) => setUpdateValues(formData)}
                            tagName="div"
                        >
                            <div /> {/* remove the built in submit button */}
                        </Form>
                    ) : (
                        <EntityProperties
                            entityTemplate={entityTemplate}
                            properties={entity.properties}
                            style={{
                                columnCount: 3,
                                columnGap: '40px',
                                columnRule: '2px solid #B1B1B1',
                            }}
                        />
                    )}
                    <Grid item>
                        {isEditMode ? (
                            <IconButton onClick={() => updateMutation({ ...entity, properties: updateValues })}>
                                <DoneIcon />
                                {isUpdateLoading && <CircularProgress size={20} />}
                            </IconButton>
                        ) : (
                            <Grid container direction="column">
                                <IconButton onClick={() => navigate(`/entity/${entity.properties._id}/graph`, { state: expandedEntity })}>
                                    <GraphIcon />
                                </IconButton>
                                <IconButton onClick={() => setIsEditMode(true)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => setOpenDeleteDialog(true)}>
                                    <DeleteIcon />
                                </IconButton>
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </CardContent>
            <AreYouSureDialog open={openDeleteDialog} handleClose={closeDeleteDialog} onYes={() => deleteMutation()} isLoading={isDeleteLoading} />
        </Card>
    );
};

export { EntityDetails };
