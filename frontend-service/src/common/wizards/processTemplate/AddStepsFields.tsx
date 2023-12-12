import React, { useState } from 'react';
import { AccordionDetails, AccordionSummary, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { ExpandMore as ExpandMoreIcon, Delete as DeleteIcon } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import _debounce from 'lodash.debounce';
import { FieldArray, FormikErrors } from 'formik';
import { processTemplateUniquePropertiesSteps, variableNameValidation } from '../../../utils/validation';
import { ProcessTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';
import StepsApproversBlock from './StepsApproversBlock';
import StepsIconBlock from './StepsIconBlock';
import { StepsNameBlock } from './StepsNameBlock';
import FieldBlock, { FieldBlockAccordion } from '../entityTemplate/FieldBlock';
import { attachmentPropertiesBaseSchema, propertiesBaseSchema } from '../entityTemplate/AddFields';
import { initialFieldCardDataOnAdd, useAreThereProcessInstancesByTemplateId } from './AddDetailsFields';

const stepTemplateUniqueNames = (value, context: Yup.TestContext) => {
    if (!value) return true;
    const steps = value.steps as ProcessTemplateWizardValues['steps'];
    const errors: Yup.ValidationError[] = [];
    steps.forEach((step, index) => {
        const doesStepHasDuplicateName = steps.some(({ name }, restStepsIndex) => step.name === name && index !== restStepsIndex);
        const doesStepHasDuplicateDisplayName = steps.some(
            ({ displayName }, restStepsIndex) => step.displayName === displayName && index !== restStepsIndex,
        );
        if (doesStepHasDuplicateName) {
            errors.push(context.createError({ message: i18next.t('validation.stepNameExists'), path: `steps[${index}].name` }));
        }
        if (doesStepHasDuplicateDisplayName) {
            errors.push(context.createError({ message: i18next.t('validation.stepDisplayNameExists'), path: `steps[${index}].displayName` }));
        }
    });

    if (errors.length) {
        return new Yup.ValidationError(errors);
    }

    return true;
};
const addStepsFieldsSchema = Yup.object({
    steps: Yup.array()
        .of(
            Yup.object({
                properties: Yup.array().of(propertiesBaseSchema).min(1, i18next.t('validation.oneField')),
                attachmentProperties: Yup.array().of(attachmentPropertiesBaseSchema),
                reviewers: Yup.array().of(Yup.object({})).min(1, i18next.t('validation.oneField')),
                icon: Yup.object({
                    name: Yup.string().required(i18next.t('validation.required')),
                }).required(i18next.t('validation.required')),
                name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
                displayName: Yup.string().required(i18next.t('validation.required')),
            }),
        )
        .required(i18next.t('validation.oneField'))
        .min(1, i18next.t('validation.oneField')),
})
    .test('uniqueProperties', processTemplateUniquePropertiesSteps)
    .test('uniqueStepNames', stepTemplateUniqueNames);

const AddStepsFields: React.FC<StepComponentProps<ProcessTemplateWizardValues, 'isEditMode' | 'setBlock'>> = ({
    values,
    touched,
    errors,
    setFieldValue,
    initialValues,
    isEditMode,
    setBlock,
}) => {
    const { areThereAnyInstances } = useAreThereProcessInstancesByTemplateId(
        (values as ProcessTemplateWizardValues & { _id: string })._id,
        isEditMode,
    );

    const errorsOfSteps = errors.steps as FormikErrors<ProcessTemplateWizardValues['steps'][number]> | undefined;

    const [expandedIndex, setExpandedIndex] = useState<number | false>(false);

    const handleChange = (index: number) => {
        setExpandedIndex((prevIndex) => (prevIndex === index ? false : index));
    };
    const isFieldBlockTouched = touched?.steps;

    return (
        <Grid style={{ width: '100%' }}>
            <FieldArray name="steps">
                {({ push, remove }) => (
                    <Grid>
                        <Grid>
                            {errorsOfSteps === i18next.t('validation.oneField') && (
                                <div style={{ color: '#d32f2f', alignItems: 'center', justifyContent: 'center' }}>
                                    {i18next.t('validation.oneStep')}
                                </div>
                            )}
                            <Tooltip
                                title={
                                    isEditMode && areThereAnyInstances
                                        ? i18next.t('wizard.processTemplate.blockAdd')
                                        : i18next.t('wizard.processTemplate.addStep')
                                }
                                placement="top"
                                arrow
                                sx={{ color: 'white' }}
                            >
                                <span>
                                    <IconButton
                                        style={{ justifyContent: 'center', color: '#1B7BB9' }}
                                        disabled={isEditMode && areThereAnyInstances}
                                        onClick={() =>
                                            push({
                                                name: '',
                                                displayName: '',
                                                properties: [],
                                                attachmentProperties: [],
                                                reviewers: [],
                                                icon: { file: { name: '' }, name: '' },
                                            })
                                        }
                                        size="large"
                                    >
                                        <AddIcon fontSize="large" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Grid>
                        <Grid>
                            {values.steps.map((step, index) => (
                                <FieldBlockAccordion
                                    style={{ border: isFieldBlockTouched && errors.steps?.[index] ? '1px solid red' : '' }}
                                    expanded={expandedIndex === index}
                                    onChange={() => handleChange(index)}
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={index}
                                    TransitionProps={{ unmountOnExit: true }} // performance issues with many steps
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>{` ${i18next.t('wizard.processTemplate.level')}: ${
                                            values.steps[index].displayName || ''
                                        }`}</Typography>
                                    </AccordionSummary>
                                    <Grid item>
                                        <StepsNameBlock
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            propIndex={index}
                                            setFieldValue={setFieldValue}
                                            isEditMode={isEditMode}
                                            areThereAnyInstances={areThereAnyInstances}
                                        />
                                    </Grid>
                                    <AccordionDetails>
                                        <Grid container direction="column" alignItems="stretch" spacing={1}>
                                            <Grid item>
                                                <FieldBlock
                                                    propertiesType="properties"
                                                    values={step}
                                                    initialValues={initialValues.steps[index]}
                                                    setFieldValue={(field, ...rest) => setFieldValue(`steps[${index}].${field}`, ...rest)}
                                                    areThereAnyInstances={areThereAnyInstances}
                                                    isEditMode={isEditMode}
                                                    setBlock={setBlock}
                                                    title={i18next.t('wizard.processTemplate.properties')}
                                                    addPropertyButtonLabel={i18next.t('wizard.processTemplate.addProperty')}
                                                    touched={touched.steps?.[index]}
                                                    errors={
                                                        typeof errors.steps === 'string'
                                                            ? undefined
                                                            : (errors.steps?.[index] as
                                                                  | FormikErrors<ProcessTemplateWizardValues['steps'][number]>
                                                                  | undefined)
                                                    }
                                                    initialFieldCardDataOnAdd={initialFieldCardDataOnAdd}
                                                    supportSerialNumberType={false}
                                                    supportEntityReferenceType
                                                />
                                            </Grid>

                                            <Grid item>
                                                <FieldBlock
                                                    propertiesType="attachmentProperties"
                                                    values={step}
                                                    initialValues={initialValues.steps[index]}
                                                    setFieldValue={(field, ...rest) => setFieldValue(`steps[${index}].${field}`, ...rest)}
                                                    areThereAnyInstances={areThereAnyInstances}
                                                    isEditMode={isEditMode}
                                                    setBlock={setBlock}
                                                    title={i18next.t('wizard.processTemplate.attachments')}
                                                    addPropertyButtonLabel={i18next.t('wizard.processTemplate.addAttachment')}
                                                    touched={touched.steps?.[index]}
                                                    errors={
                                                        typeof errors.steps === 'string'
                                                            ? undefined
                                                            : (errors.steps?.[index] as
                                                                  | FormikErrors<ProcessTemplateWizardValues['steps'][number]>
                                                                  | undefined)
                                                    }
                                                    initialFieldCardDataOnAdd={initialFieldCardDataOnAdd}
                                                    supportSerialNumberType={false}
                                                    supportEntityReferenceType
                                                />
                                            </Grid>
                                            <Grid item>
                                                <StepsApproversBlock
                                                    touched={touched.steps?.[index]}
                                                    values={values}
                                                    title={i18next.t('wizard.processTemplate.approvers')}
                                                    propIndex={index}
                                                    setFieldValue={setFieldValue}
                                                    errors={errors}
                                                    isEditMode={isEditMode}
                                                    areThereAnyInstances={areThereAnyInstances}
                                                />
                                            </Grid>
                                            <Grid item>
                                                <StepsIconBlock
                                                    touched={touched.steps?.[index]}
                                                    values={values}
                                                    setFieldValue={setFieldValue}
                                                    title={i18next.t('wizard.processTemplate.icon')}
                                                    propIndex={index}
                                                    errors={errors}
                                                    isEditMode={isEditMode}
                                                    areThereAnyInstances={areThereAnyInstances}
                                                />
                                            </Grid>
                                        </Grid>
                                        <Grid>
                                            <IconButton
                                                style={{ marginRight: '95%' }}
                                                disabled={isEditMode && areThereAnyInstances}
                                                onClick={() => {
                                                    remove(index);
                                                }}
                                                size="large"
                                            >
                                                <DeleteIcon fontSize="medium" />
                                            </IconButton>
                                        </Grid>
                                    </AccordionDetails>
                                </FieldBlockAccordion>
                            ))}
                        </Grid>
                    </Grid>
                )}
            </FieldArray>
        </Grid>
    );
};

export { AddStepsFields, addStepsFieldsSchema };
