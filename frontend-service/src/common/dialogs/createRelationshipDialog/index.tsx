import React from 'react';
import i18next from 'i18next';
import { Form, Formik, FormikErrors, FormikProps, yupToFormErrors } from 'formik';
import * as Yup from 'yup';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import { CompareArrows as CompareArrowsIcon } from '@mui/icons-material';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { IEntity } from '../../../interfaces/entities';
import { IMongoRelationshipTemplatePopulated } from '../../../interfaces/relationshipTemplates';
import RelationshipTemplateAutocomplete from '../../inputs/RelationshipTemplateAutocomplete';
import TemplateTableSelect from '../../inputs/TemplateTableSelect';
import StrechableArrowRight from './strechableArrowRight';
import { trycatch } from '../../../utils/trycatch';
import { createRelationshipRequest } from '../../../services/relationshipsService';
import { IRelationship } from '../../../interfaces/relationships';

export interface ICreateRelationshipValues {
    relationshipTemplate: IMongoRelationshipTemplatePopulated | null;
    sourceEntity: IEntity | null;
    destinationEntity: IEntity | null;
}

const defaultInitialValues: ICreateRelationshipValues = {
    relationshipTemplate: null,
    sourceEntity: null,
    destinationEntity: null,
};

const sourceOrDestinationEntitySchema = Yup.object()
    .nullable()
    .when('relationshipTemplate', {
        is: (relationshipTemplate) => Boolean(relationshipTemplate),
        then: (schema) => schema.required(i18next.t('validation.required')),
        otherwise: (schema) => schema.test('always-fail', i18next.t('addRelationshipDialog.entityFirstMustChooseRelationshipTemplate'), () => false),
    });

const validationSchema = Yup.object({
    relationshipTemplate: Yup.object().nullable().required(i18next.t('validation.required')),
    sourceEntity: sourceOrDestinationEntitySchema,
    destinationEntity: sourceOrDestinationEntitySchema,
});

const validateForm = async (values: ICreateRelationshipValues): Promise<FormikErrors<ICreateRelationshipValues>> => {
    const { err: validationSchemaErr } = await trycatch(() => validationSchema.validate(values, { abortEarly: false }));
    const validationSchemaErrors = !validationSchemaErr ? {} : yupToFormErrors<ICreateRelationshipValues>(validationSchemaErr);

    const nonSchemaErrors: FormikErrors<ICreateRelationshipValues> = {};

    const { relationshipTemplate, sourceEntity, destinationEntity } = values;

    if (relationshipTemplate && sourceEntity && relationshipTemplate.sourceEntity._id !== sourceEntity.templateId) {
        nonSchemaErrors.sourceEntity = i18next.t('addRelationshipDialog.entityDoesntFitRelationshipTemplateMessage');
    }

    if (relationshipTemplate && destinationEntity && relationshipTemplate.destinationEntity._id !== destinationEntity.templateId) {
        nonSchemaErrors.destinationEntity = i18next.t('addRelationshipDialog.entityDoesntFitRelationshipTemplateMessage');
    }

    return { ...validationSchemaErrors, ...nonSchemaErrors };
};

const SwitchSidesButton: React.FC<{ formikProps: FormikProps<ICreateRelationshipValues> }> = ({ formikProps }) => {
    return (
        <Button
            variant="outlined"
            onClick={() => {
                formikProps.setValues((prevValues) => ({
                    ...prevValues,
                    sourceEntity: formikProps.values.destinationEntity,
                    destinationEntity: formikProps.values.sourceEntity,
                }));

                if (formikProps.values.sourceEntity || formikProps.values.destinationEntity) {
                    // dont trigger validate, validate will trigger from formikProps.setValues after changed
                    formikProps.setFieldTouched('sourceEntity', true, false);
                    formikProps.setFieldTouched('destinationEntity', true, false);
                }
            }}
        >
            <CompareArrowsIcon color="primary" />
            <Typography fontSize={14} style={{ fontWeight: '500', paddingRight: '5px' }}>
                {i18next.t('addRelationshipDialog.switchSidesBtn')}
            </Typography>
        </Button>
    );
};

const shouldSwitchSourceAndDestinationOnRelationshipTemplateChange = (
    prevValues: ICreateRelationshipValues,
    chosenRelationshipTemplate: IMongoRelationshipTemplatePopulated | null,
) => {
    const doesSourceFitRelationshipTemplate = chosenRelationshipTemplate?.sourceEntity._id === prevValues.sourceEntity?.templateId;
    const doesSourceFitRelationshipTemplateAfterMoved = chosenRelationshipTemplate?.destinationEntity._id === prevValues.sourceEntity?.templateId;

    const doesDestinationFitRelationshipTemplate = chosenRelationshipTemplate?.destinationEntity._id === prevValues.destinationEntity?.templateId;
    const doesDestinationFitRelationshipTemplateAfterMoved =
        chosenRelationshipTemplate?.sourceEntity._id === prevValues.destinationEntity?.templateId;

    const numberOfFitsBefore = Number(doesSourceFitRelationshipTemplate) + Number(doesDestinationFitRelationshipTemplate);

    const numberOfFitsAfterSwitched = Number(doesSourceFitRelationshipTemplateAfterMoved) + Number(doesDestinationFitRelationshipTemplateAfterMoved);

    return numberOfFitsAfterSwitched > numberOfFitsBefore;
};

const RelationshipTemplateInput: React.FC<{ formikProps: FormikProps<ICreateRelationshipValues> }> = ({ formikProps }) => {
    const onChange = (chosenRelationshipTemplate: IMongoRelationshipTemplatePopulated | null) => {
        formikProps.setValues((prevValues) => {
            const shouldSwitchSourceAndDestination = shouldSwitchSourceAndDestinationOnRelationshipTemplateChange(
                prevValues,
                chosenRelationshipTemplate,
            );
            if (shouldSwitchSourceAndDestination) {
                return {
                    sourceEntity: prevValues.destinationEntity,
                    destinationEntity: prevValues.sourceEntity,
                    relationshipTemplate: chosenRelationshipTemplate,
                };
            }
            return {
                ...prevValues,
                relationshipTemplate: chosenRelationshipTemplate,
            };
        });
    };

    return (
        <RelationshipTemplateAutocomplete
            value={formikProps.values.relationshipTemplate}
            onChange={(_e, chosenRelationshipTemplate) => onChange(chosenRelationshipTemplate)}
            entityTemplatesIdsConstraints={
                [formikProps.values.sourceEntity?.templateId, formikProps.values.destinationEntity?.templateId].filter(Boolean) as string[]
            }
            onBlur={formikProps.handleBlur('relationshipTemplate')}
            disabled={formikProps.isSubmitting}
            isError={Boolean(formikProps.touched.relationshipTemplate && formikProps.errors.relationshipTemplate)}
            helperText={formikProps.touched.relationshipTemplate ? formikProps.errors.relationshipTemplate : ''}
        />
    );
};

const SourceOrDestinationEntityInput: React.FC<{
    field: 'sourceEntity' | 'destinationEntity';
    formikProps: FormikProps<ICreateRelationshipValues>;
    label: string;
}> = ({ formikProps, field, label }) => {
    return (
        <TemplateTableSelect
            entityTemplate={formikProps.values.relationshipTemplate?.[field]}
            value={formikProps.values[field]}
            onChange={(entity) => {
                formikProps.setFieldValue(field, entity);
                formikProps.setFieldTouched(field, true, false); // setFieldValue will validate after change
            }}
            onBlur={(event) => {
                formikProps.handleBlur(field)(event);
                formikProps.setFieldTouched('relationshipTemplate'); // make him touched because depends on rel template to be defined
            }}
            error={Boolean(formikProps.touched[field] && formikProps.errors[field])}
            helperText={formikProps.touched[field] ? formikProps.errors[field] : ''}
            label={label}
            hideNonPreview
        />
    );
};

const CreateRelationshipDialog: React.FC<{
    isOpen: boolean;
    handleClose: () => void;
    onSubmitSuccess: (createdRelationship: IRelationship, sourceEntity: IEntity, destinationEntity: IEntity) => void;
    initialValues?: Partial<ICreateRelationshipValues>;
}> = ({ isOpen, handleClose, onSubmitSuccess = () => {}, initialValues: parentInitialValues }) => {
    const initialValues = { ...defaultInitialValues, ...parentInitialValues };

    const { mutateAsync: createRelationship } = useMutation(createRelationshipRequest, {
        onError: (error) => {
            console.log('failed to create relationship. error:', error);
            toast.error(i18next.t('addRelationshipDialog.failedToCreateRelationship'));
        },
        onSuccess: () => {
            toast.success(i18next.t('addRelationshipDialog.succeededToCreateRelationship'));
            handleClose();
        },
    });

    return (
        <Dialog open={isOpen} fullWidth maxWidth="xl" keepMounted={false} disableEnforceFocus>
            <Formik
                initialValues={initialValues}
                onSubmit={async ({ relationshipTemplate, sourceEntity, destinationEntity }) => {
                    const createdRelationship = await createRelationship({
                        templateId: relationshipTemplate!._id,
                        sourceEntityId: sourceEntity!.properties._id,
                        destinationEntityId: destinationEntity!.properties._id,
                        properties: {},
                    });
                    onSubmitSuccess(createdRelationship, sourceEntity!, destinationEntity!);
                }}
                validate={validateForm}
            >
                {(formikProps: FormikProps<ICreateRelationshipValues>) => (
                    <Form>
                        <DialogTitle>{i18next.t('addRelationshipDialog.title')}</DialogTitle>
                        <DialogContent>
                            <Grid container alignItems="center" spacing={1}>
                                <Grid item xs={4}>
                                    <SourceOrDestinationEntityInput
                                        field="sourceEntity"
                                        formikProps={formikProps}
                                        label={i18next.t('addRelationshipDialog.selectSourceEntityLabel')}
                                    />
                                </Grid>
                                <Grid item xs={4} container direction="column" alignItems="stretch" spacing={1}>
                                    <Grid item container justifyContent="center">
                                        <Grid item>
                                            <SwitchSidesButton formikProps={formikProps} />
                                        </Grid>
                                    </Grid>
                                    <Grid item>
                                        <Box sx={{ margin: '5px' }}>
                                            <RelationshipTemplateInput formikProps={formikProps} />
                                        </Box>
                                    </Grid>
                                    <Grid item container justifyContent="center">
                                        <Grid item xs={8}>
                                            <StrechableArrowRight />
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <Grid item xs={4}>
                                    <SourceOrDestinationEntityInput
                                        field="destinationEntity"
                                        formikProps={formikProps}
                                        label={i18next.t('addRelationshipDialog.selectDestinationEntityLabel')}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose} autoFocus disabled={formikProps.isSubmitting}>
                                {i18next.t('addRelationshipDialog.closeBtn')}
                            </Button>
                            <Button type="submit" variant="contained" autoFocus disabled={formikProps.isSubmitting}>
                                {i18next.t('addRelationshipDialog.createBtn')}
                                {formikProps.isSubmitting && <CircularProgress size={20} />}
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
};

export default CreateRelationshipDialog;
