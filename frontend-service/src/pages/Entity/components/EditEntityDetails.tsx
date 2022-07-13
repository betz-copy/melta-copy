import React from 'react';
import { Grid, Card, CardContent, CircularProgress, Box, Divider, Button } from '@mui/material';
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
import { JSONSchemaFormik, ajvValidate } from '../../../common/inputs/JSONSchemaFormik';
import { BlueTitle } from '../../../common/BlueTitle';
import { filterAttachmentsPropertiesFromSchema } from '../../../utils/filterAttachmentsFromSchema';

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
            validate={(values) => {
                const nonAttachmentsSchema = filterAttachmentsPropertiesFromSchema(entityTemplate.properties);
                const propertiesErrors = ajvValidate(nonAttachmentsSchema, values.properties);
                if (Object.keys(propertiesErrors).length === 0) {
                    return {};
                }
                return { properties: propertiesErrors };
            }}
        >
            {({ setFieldValue, values, errors, touched, setFieldTouched }) => {
                return (
                    <Form>
                        <Card>
                            <CardContent>
                                <Grid container justifyContent="center">
                                    <Grid item xs={12}>
                                        <Grid container flexDirection="row">
                                            <Box sx={{ marginRight: '50px' }}>
                                                <BlueTitle title={i18next.t('wizard.entityTemplate.properties')} component="h6" variant="h6" />
                                                <JSONSchemaFormik
                                                    schema={filterAttachmentsPropertiesFromSchema(entityTemplate.properties)}
                                                    values={values}
                                                    setValues={(propertiesValues) => setFieldValue('properties', propertiesValues)}
                                                    errors={errors.properties ?? {}}
                                                    touched={touched.properties ?? {}}
                                                    setFieldTouched={(field) => setFieldTouched(`properties.${field}`)}
                                                />
                                            </Box>
                                            {templateFileKeys.length > 0 && (
                                                <Box>
                                                    <BlueTitle
                                                        title={i18next.t('wizard.entityTemplate.attachments')}
                                                        component="h6"
                                                        variant="h6"
                                                        style={{ marginBottom: '22px' }}
                                                    />
                                                    <EntityFilesInput
                                                        requiredFilesNames={requiredFilesNames}
                                                        filesProperties={templateFilesProperties}
                                                        setFieldValue={setFieldValue}
                                                        errors={errors}
                                                        values={values}
                                                    />
                                                </Box>
                                            )}
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Divider />
                                    </Grid>
                                    <Grid item marginTop="20px">
                                        <Grid container spacing={4}>
                                            <Grid item>
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    startIcon={
                                                        isUpdateLoading ? <CircularProgress sx={{ color: 'white' }} size={20} /> : <DoneIcon />
                                                    }
                                                >
                                                    {i18next.t('entityPage.save')}
                                                </Button>
                                            </Grid>
                                            <Grid item>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<ClearIcon />}
                                                    onClick={() => {
                                                        setIsEditMode(false);
                                                    }}
                                                >
                                                    {i18next.t('entityPage.cancel')}
                                                </Button>
                                            </Grid>
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
