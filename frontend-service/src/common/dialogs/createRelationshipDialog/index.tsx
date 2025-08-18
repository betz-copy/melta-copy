import React, { useState } from 'react';
import i18next from 'i18next';
import { Form, Formik, FormikErrors, FormikProps, yupToFormErrors } from 'formik';
import * as Yup from 'yup';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { IEntity } from '../../../interfaces/entities';
import { IMongoRelationshipTemplatePopulated } from '../../../interfaces/relationshipTemplates';
import RelationshipTemplateAutocomplete from '../../inputs/RelationshipTemplateAutocomplete';
import TemplateTableSelect from '../../inputs/TemplateTableSelect';
import StrechableArrowRight from './strechableArrowRight';
import { trycatch } from '../../../utils/trycatch';
import { createRelationshipRequest } from '../../../services/relationshipsService';
import { IRelationship } from '../../../interfaces/relationships';
import { ErrorToast } from '../../ErrorToast';
import { IBrokenRule, IRuleBreachPopulated } from '../../../interfaces/ruleBreaches/ruleBreach';
import { ICreateRelationshipMetadataPopulated } from '../../../interfaces/ruleBreaches/actionMetadata';
import CreateWithRuleBreachDialog from './CreateWithRuleBreachDialog';
import { environment } from '../../../globals';
import { useDarkModeStore } from '../../../stores/darkMode';
import { PermissionScope } from '../../../interfaces/permissions';
import { IErrorResponse } from '../../../interfaces/error';

const { errorCodes } = environment;

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
    addNewEntityLabel: string;
}> = ({ formikProps, field, label, addNewEntityLabel }) => {
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
            addNewEntityLabel={addNewEntityLabel}
            hideNonPreview
            checkUsersPermissions={PermissionScope.write}
        />
    );
};

interface ICreateRelationshipBodyPopulated {
    relationshipInstancePopulated: {
        relationshipTemplateId: string;
        sourceEntity: IEntity;
        destinationEntity: IEntity;
    };
    rawBrokenRules?: IBrokenRule[];
}

const CreateRelationshipDialog: React.FC<{
    isOpen: boolean;
    handleClose: () => void;
    onSubmitSuccess: (createdRelationship: IRelationship, sourceEntity: IEntity, destinationEntity: IEntity) => void;
    initialValues?: Partial<ICreateRelationshipValues>;
}> = ({ isOpen, handleClose, onSubmitSuccess = () => {}, initialValues: parentInitialValues }) => {
    const initialValues = { ...defaultInitialValues, ...parentInitialValues };

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [createWithRuleBreachDialogState, setCreateWithRuleBreachDialogState] = useState<{
        isOpen: boolean;
        brokenRules?: IRuleBreachPopulated['brokenRules'];
        rawBrokenRules?: IBrokenRule[];
        actionMetadata?: ICreateRelationshipMetadataPopulated;
    }>({ isOpen: false });

    const { mutateAsync: createRelationship, isLoading: isLoadingCreateRelationship } = useMutation(
        ({
            relationshipInstancePopulated: { relationshipTemplateId, sourceEntity, destinationEntity },
            rawBrokenRules,
        }: ICreateRelationshipBodyPopulated) => {
            return createRelationshipRequest({
                relationshipInstance: {
                    templateId: relationshipTemplateId,
                    sourceEntityId: sourceEntity.properties._id,
                    destinationEntityId: destinationEntity.properties._id,
                    properties: {},
                },
                ignoredRules: rawBrokenRules,
            });
        },
        {
            onError: (err: AxiosError, { relationshipInstancePopulated }) => {
                const errorMetadata = (err.response?.data as IErrorResponse)?.metadata;
                if (errorMetadata?.errorCode === errorCodes.ruleBlock) {
                    setCreateWithRuleBreachDialogState({
                        isOpen: true,
                        brokenRules: errorMetadata.brokenRules,
                        rawBrokenRules: errorMetadata.rawBrokenRules,
                        actionMetadata: relationshipInstancePopulated,
                    });
                }

                console.error('failed to create relationship. error:', err);
                toast.error(<ErrorToast axiosError={err} defaultErrorMessage={i18next.t('addRelationshipDialog.failedToCreateRelationship')} />);
            },
            onSuccess: (createdRelationship, { relationshipInstancePopulated: { sourceEntity, destinationEntity } }) => {
                toast.success(i18next.t('addRelationshipDialog.succeededToCreateRelationship'));
                handleClose();

                onSubmitSuccess(createdRelationship, sourceEntity, destinationEntity);
            },
        },
    );

    return (
        <>
            <Dialog open={isOpen} fullWidth maxWidth="xl" PaperProps={{ sx: { bgcolor: darkMode ? '#060606' : 'white' } }}>
                <Formik
                    initialValues={initialValues}
                    onSubmit={(values) =>
                        createRelationship({
                            relationshipInstancePopulated: {
                                relationshipTemplateId: values.relationshipTemplate!._id,
                                sourceEntity: values.sourceEntity!,
                                destinationEntity: values.destinationEntity!,
                            },
                        })
                    }
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
                                            addNewEntityLabel={i18next.t('addRelationshipDialog.addSourceEntityLabel')}
                                        />
                                    </Grid>
                                    <Grid item xs={4} container direction="column" alignItems="stretch" spacing={1}>
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
                                            addNewEntityLabel={i18next.t('addRelationshipDialog.addDestinationEntityLabel')}
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
            {createWithRuleBreachDialogState.isOpen && (
                <CreateWithRuleBreachDialog
                    handleClose={() => setCreateWithRuleBreachDialogState({ isOpen: false })}
                    brokenRules={createWithRuleBreachDialogState.brokenRules!}
                    rawBrokenRules={createWithRuleBreachDialogState.rawBrokenRules!}
                    actionMetadata={createWithRuleBreachDialogState.actionMetadata!}
                    onCreateRelationship={async () => {
                        await createRelationship({
                            relationshipInstancePopulated: {
                                relationshipTemplateId: createWithRuleBreachDialogState.actionMetadata!.relationshipTemplateId,
                                sourceEntity: createWithRuleBreachDialogState.actionMetadata!.sourceEntity! as IEntity,
                                destinationEntity: createWithRuleBreachDialogState.actionMetadata!.destinationEntity! as IEntity,
                            },
                            rawBrokenRules: createWithRuleBreachDialogState.rawBrokenRules!,
                        });
                    }}
                    isLoadingCreateRelationship={isLoadingCreateRelationship}
                    onCreateRuleBreachRequest={() => handleClose()}
                    onUpdatedRuleBlock={(brokenRules) =>
                        setCreateWithRuleBreachDialogState(({ actionMetadata }) => ({ isOpen: true, brokenRules, actionMetadata }))
                    }
                />
            )}
        </>
    );
};

export default CreateRelationshipDialog;
