import React from 'react';
import { Grid, Card, CardContent, CircularProgress, Box, Divider, Button } from '@mui/material';
import { Done as DoneIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useMutation } from 'react-query';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { Form, Formik } from 'formik';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntity, IEntityExpanded } from '../../../interfaces/entities';
import { duplicateEntityRequest } from '../../../services/entitiesService';
import { EntityWizardValues } from '../../../common/dialogs/entity';
import { JSONSchemaFormik, ajvValidate } from '../../../common/inputs/JSONSchemaFormik';
import { BlueTitle } from '../../../common/BlueTitle';
import { filterAttachmentsAndEntitiesRefFromPropertiesSchema } from '../../../utils/pickFieldsPropertiesSchema';
import { DuplicateTopBar } from './DuplicateTopBar';
import { environment } from '../../../globals';
import { toastConstraintValidationError } from '../../../common/dialogs/entity/toastConstraintValidationError';
import { InstanceFileInput } from '../../../common/inputs/InstanceFilesInput/InstanceFileInput';

const { errorCodes } = environment;

const DuplicateEntity: React.FC<{}> = () => {
    const { state } = useLocation();
    const { entityTemplate, expandedEntity } = state as {
        entityTemplate: IMongoEntityTemplatePopulated;
        expandedEntity: IEntityExpanded;
    };
    const { entity } = expandedEntity;
    const navigate = useNavigate();
    if (!state) {
        navigate(`/entity/${entity?.properties._id}`);
    }

    const { isLoading: isDuplicateLoading, mutateAsync: duplicateMutation } = useMutation(
        (newEntityDate: EntityWizardValues) => duplicateEntityRequest(entity.properties._id, newEntityDate),
        {
            onSuccess: (data) => {
                toast.success(i18next.t('wizard.entity.duplicatedSuccessfully'));
                navigate(`/entity/${data?.properties._id}`);
            },
            onError: (err: AxiosError) => {
                const errorMetadata = err.response?.data?.metadata;
                if (errorMetadata?.errorCode === errorCodes.failedConstraintsValidation) {
                    toastConstraintValidationError(errorMetadata, entityTemplate);
                    return;
                }

                toast.error(i18next.t('wizard.entity.failedToDuplicate'));
            },
        },
    );

    const templateFilesProperties = pickBy(entityTemplate.properties.properties, (value) => value.format === 'fileId');
    const templateFileKeys = Object.keys(templateFilesProperties);
    const requiredFilesNames = entityTemplate.properties.required.filter((name) => templateFileKeys.includes(name));

    const fieldProperties = pickBy(entity.properties, (_value, key) => !templateFileKeys.includes(key)) as IEntity['properties'];
    const fileIdsProperties = pickBy(entity.properties, (_value, key) => templateFileKeys.includes(key));
    const fileProperties = mapValues(fileIdsProperties, (value) => ({ name: value })) as Record<string, File>;

    return (
        <Formik
            initialValues={{ properties: fieldProperties, attachmentsProperties: fileProperties }}
            onSubmit={async (values) => {
                duplicateMutation({ ...values, template: entityTemplate });
            }}
            validate={(values) => {
                const nonAttachmentsSchema = filterAttachmentsAndEntitiesRefFromPropertiesSchema(entityTemplate.properties);
                const propertiesErrors = ajvValidate(nonAttachmentsSchema, values.properties);
                if (Object.keys(propertiesErrors).length === 0) {
                    return {};
                }
                return { properties: propertiesErrors };
            }}
        >
            {({ setFieldValue, values, errors, touched, setFieldTouched }) => {
                return (
                    <>
                        <DuplicateTopBar entityTemplate={entityTemplate} />
                        <Form>
                            <Grid className="pageMargin">
                                <Grid item marginTop="20px">
                                    <Card style={{ marginTop: '20px' }}>
                                        <CardContent>
                                            <Grid container justifyContent="center">
                                                <Grid item xs={12}>
                                                    <Grid container flexDirection="row">
                                                        <Box sx={{ marginRight: '50px' }}>
                                                            <BlueTitle
                                                                title={i18next.t('wizard.entityTemplate.properties')}
                                                                component="h6"
                                                                variant="h6"
                                                            />
                                                            <JSONSchemaFormik
                                                                schema={filterAttachmentsAndEntitiesRefFromPropertiesSchema(
                                                                    entityTemplate.properties,
                                                                )}
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
                                                                <div style={{ color: '#666666', fontSize: '0.9rem', padding: '2%' }}>
                                                                    {i18next.t('wizard.entityTemplate.dragAndDropFile')}
                                                                </div>
                                                                <>
                                                                    {Object.entries(templateFilesProperties).map(([key, value]) => {
                                                                        console.log("IN DUPLICATE ENTITY:", key,value, values.attachmentsProperties); (
                                                                        <InstanceFileInput
                                                                            key={key}
                                                                            fileFieldName={`attachmentsProperties.${key}`}
                                                                            fieldTemplateTitle={value.title}
                                                                            setFieldValue={setFieldValue}
                                                                            required={requiredFilesNames.includes(key)}
                                                                            value={values.attachmentsProperties[key]}
                                                                            error={
                                                                                errors.attachmentsProperties?.[key]
                                                                                    ? JSON.stringify(errors.attachmentsProperties?.[key])
                                                                                    : undefined
                                                                            }
                                                                            setFieldTouched={setFieldTouched}
                                                                        />
                                                                    )})}
                                                                </>
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
                                                                    isDuplicateLoading ? (
                                                                        <CircularProgress sx={{ color: 'white' }} size={20} />
                                                                    ) : (
                                                                        <DoneIcon />
                                                                    )
                                                                }
                                                            >
                                                                {i18next.t('entityPage.duplicate')}
                                                            </Button>
                                                        </Grid>
                                                        <Grid item>
                                                            <Button
                                                                variant="outlined"
                                                                startIcon={<ClearIcon />}
                                                                onClick={() => {
                                                                    navigate(`/entity/${entity.properties._id}`);
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
                                </Grid>
                            </Grid>
                        </Form>
                    </>
                );
            }}
        </Formik>
    );
};

export default DuplicateEntity;
