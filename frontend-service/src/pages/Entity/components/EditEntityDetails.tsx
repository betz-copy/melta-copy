import React from 'react';
import { Grid, Card, CardContent, IconButton, CircularProgress, Box, Typography } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { Form, Formik } from 'formik';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntityExpanded } from '../../../interfaces/entities';
import { updateEntityRequest } from '../../../services/entitiesService';
import { EntityWizardValues } from '../../../common/wizards/entity';
import { objectFilter, objectMap } from '../../../utils/object';
import { EntityFilesInput } from '../../../common/inputs/EntityFilesInput';
import { EntityPropertiesInput } from '../../../common/inputs/EntityPropertiesInput';

const EditEntityDetails: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ entityTemplate, expandedEntity, setIsEditMode }) => {
    const { entity } = expandedEntity;
    const queryClient = useQueryClient();

    const { isLoading: isUpdateLoading, mutateAsync: updateMutation } = useMutation(
        (newEntityDate: EntityWizardValues) => updateEntityRequest(entity.properties._id, newEntityDate),
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

    const templateFilesProperties = objectFilter(entityTemplate.properties.properties, (_key, value) => value.format === 'fileId');
    const templateFileKeys = Object.keys(templateFilesProperties);
    const requiredFilesNames = entityTemplate.properties.required.filter((name) => templateFileKeys.includes(name));

    const fieldProperties = objectFilter(entity.properties, (key) => !templateFileKeys.includes(key));
    const fileIdsProperties = objectFilter(entity.properties, (key) => templateFileKeys.includes(key));
    const fileProperties = objectMap(fileIdsProperties, (_key, value) => {
        return { name: value };
    });

    return (
        <Formik
            initialValues={{ properties: fieldProperties, attachmentsProperties: fileProperties }}
            onSubmit={async (values) => {
                updateMutation({ ...values, template: entityTemplate });
            }}
        >
            {({ setFieldValue, values, errors }) => {
                return (
                    <Form>
                        <Card>
                            <CardContent>
                                <Grid container flexDirection="row">
                                    <Grid item xs={12}>
                                        <Grid container flexDirection="row">
                                            <Box sx={{ marginRight: '50px' }}>
                                                {i18next.t('wizard.entityTemplate.properties')}
                                                <EntityPropertiesInput
                                                    schema={{
                                                        ...entityTemplate.properties,
                                                        properties: objectFilter(
                                                            entityTemplate.properties.properties,
                                                            (_key, value) => value.format !== 'fileId',
                                                        ),
                                                    }}
                                                    values={values}
                                                    setFieldValue={setFieldValue}
                                                />
                                            </Box>
                                            <Box>
                                                <Typography style={{ marginBottom: '22px' }}>
                                                    {i18next.t('wizard.entityTemplate.attachments')}
                                                </Typography>
                                                <EntityFilesInput
                                                    requiredFilesNames={requiredFilesNames}
                                                    filesProperties={templateFilesProperties}
                                                    setFieldValue={setFieldValue}
                                                    errors={errors}
                                                    values={values}
                                                />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    <Grid item>
                                        <Grid item xs={12}>
                                            <IconButton type="submit">
                                                <DoneIcon />
                                                {isUpdateLoading && <CircularProgress size={20} />}
                                            </IconButton>
                                            <IconButton
                                                onClick={() => {
                                                    setIsEditMode(false);
                                                }}
                                            >
                                                <ClearIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Form>
                );
            }}
        </Formik>
    );
};

export { EditEntityDetails };
