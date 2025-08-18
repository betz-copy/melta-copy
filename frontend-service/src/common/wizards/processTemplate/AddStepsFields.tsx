import { Delete as DeleteIcon, DragHandle as DragHandleIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import { AccordionDetails, AccordionSummary, Grid, IconButton, Typography, useTheme } from '@mui/material';
import { FieldArray, FormikErrors } from 'formik';
import i18next from 'i18next';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { getEmptyImage, HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuid } from 'uuid';
import * as Yup from 'yup';
import { processTemplateUniquePropertiesSteps, variableNameValidation } from '../../../utils/validation';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { attachmentPropertiesBaseSchema } from '../entityTemplate/AddFields';
import { FieldBlockDND } from '../entityTemplate/fieldBlock/FieldBlock';
import { FieldBlockAccordion, ItemTypes } from '../entityTemplate/fieldBlock/interfaces';
import { StepComponentProps } from '../index';
import { fieldDetailsSchema, initialFieldCardDataOnAdd, useAreThereProcessInstancesByTemplateId } from './AddDetailsFields';
import { ProcessTemplateWizardValues } from './index';
import StepsApproversBlock from './StepsApproversBlock';
import StepsIconBlock from './StepsIconBlock';
import { StepsNameBlock } from './StepsNameBlock';

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
                properties: Yup.array().of(fieldDetailsSchema).min(1, i18next.t('validation.oneField')),
                attachmentProperties: Yup.array().of(
                    Yup.object({
                        type: Yup.string().oneOf(['field']).required(),
                        data: attachmentPropertiesBaseSchema.shape({
                            required: Yup.boolean().required(i18next.t('validation.required')),
                        }),
                    }),
                ),
                reviewers: Yup.array().of(Yup.object({})).min(1, i18next.t('validation.oneField')),
                icon: Yup.object({
                    name: Yup.string().nullable().optional(),
                }),
                disableAddingReviewers: Yup.boolean().nullable().optional(),
                name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
                displayName: Yup.string().required(i18next.t('validation.required')),
            }),
        )
        .required(i18next.t('validation.oneField'))
        .min(1, i18next.t('validation.oneField')),
})
    .test('uniqueProperties', processTemplateUniquePropertiesSteps)
    .test('uniqueStepNames', stepTemplateUniqueNames);

const FieldBlockStepWarper = ({
    values,
    initialValues,
    setFieldValue,
    areThereAnyInstances,
    isEditMode,
    setBlock,
    touched,
    errors,
    index,
    itemId,
    moveItem,
    step,
    remove,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const isFieldBlockTouched = touched?.steps;

    const ref = useRef<HTMLDivElement | null>(null);

    const [, drop] = useDrop({
        accept: ItemTypes.STEP,
        hover(item: { id: string; index: number }, monitor) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex) return;

            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

            moveItem(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: ItemTypes.STEP,
        item: { id: itemId, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    drag(drop(ref));

    return (
        <Grid
            item
            style={{
                opacity: isDragging ? 0.5 : 1,
                alignSelf: 'stretch',
                marginBottom: '1rem',
                cursor: 'grab',
            }}
        >
            <div ref={ref} style={{ cursor: 'grab', transition: isDragging ? 'none' : 'box-shadow 0.1s ease', opacity: isDragging ? 0.5 : 1 }}>
                <FieldBlockAccordion
                    expanded={expandedId === step.draggableId}
                    onChange={(_e, expanded) => setExpandedId(expanded ? step.draggableId : null)}
                    style={{
                        border: isFieldBlockTouched && errors.steps?.[index] ? '1px solid red' : '',
                    }}
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    TransitionProps={{ unmountOnExit: true }} // performance issues with many steps
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <DragHandleIcon />
                        <Typography>{` ${i18next.t('wizard.processTemplate.level')}: ${values.steps[index].displayName || ''}`}</Typography>
                    </AccordionSummary>
                    <Grid item sx={{ mt: '7px' }}>
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
                                <FieldBlockDND
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
                                            : (errors.steps?.[index] as FormikErrors<ProcessTemplateWizardValues['steps'][number]> | undefined)
                                    }
                                    initialFieldCardDataOnAdd={initialFieldCardDataOnAdd}
                                    supportSerialNumberType={false}
                                    supportEntityReferenceType={false}
                                    supportChangeToRequiredWithInstances={false}
                                    supportArrayFields={false}
                                    supportDeleteForExistingInstances
                                    supportRelationshipReference={false}
                                    supportUserType={false}
                                    supportConvertingToMultipleFields={false}
                                    locationSearchFields={{ show: false, disabled: false }}
                                />
                            </Grid>
                            <Grid item>
                                <FieldBlockDND
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
                                            : (errors.steps?.[index] as FormikErrors<ProcessTemplateWizardValues['steps'][number]> | undefined)
                                    }
                                    initialFieldCardDataOnAdd={initialFieldCardDataOnAdd}
                                    supportSerialNumberType={false}
                                    supportEntityReferenceType={false}
                                    supportChangeToRequiredWithInstances={false}
                                    supportArrayFields={false}
                                    supportUserType={false}
                                    supportDeleteForExistingInstances
                                    supportRelationshipReference={false}
                                    supportConvertingToMultipleFields={false}
                                    locationSearchFields={{ show: false, disabled: false }}
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
                                    disableAddingReviewersFieldName={`steps[${index}].disableAddingReviewers`}
                                    isDisableAddingReviewers={step.disableAddingReviewers || false}
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
            </div>
        </Grid>
    );
};

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

    const theme = useTheme();

    const moveItem = useCallback(
        (dragIndex, hoverIndex) => {
            const newValuesOrder = Array.from(values.steps);
            const [movedOption] = newValuesOrder.splice(dragIndex, 1);
            newValuesOrder.splice(hoverIndex, 0, movedOption);

            setFieldValue('steps', newValuesOrder);
        },
        [values.steps],
    );

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
                            <MeltaTooltip
                                title={i18next.t(`wizard.processTemplate.${isEditMode && areThereAnyInstances ? 'blockAdd' : 'addStep'}`)}
                                placement="top"
                            >
                                <span>
                                    <IconButton
                                        style={{ justifyContent: 'center', color: theme.palette.primary.main }}
                                        disabled={isEditMode && areThereAnyInstances}
                                        onClick={() =>
                                            push({
                                                draggableId: uuid(),
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
                            </MeltaTooltip>
                        </Grid>
                        <DndProvider backend={HTML5Backend}>
                            <Grid container direction="column" alignItems="center" style={{ minHeight: '160px' }}>
                                {values.steps.map((step, index) => (
                                    <FieldBlockStepWarper
                                        step={step}
                                        values={values}
                                        initialValues={initialValues}
                                        setFieldValue={setFieldValue}
                                        areThereAnyInstances={areThereAnyInstances}
                                        isEditMode={isEditMode}
                                        setBlock={setBlock}
                                        touched={touched}
                                        errors={errors}
                                        key={step._id}
                                        itemId={step._id}
                                        moveItem={moveItem}
                                        index={index}
                                        remove={remove}
                                    />
                                ))}
                            </Grid>
                        </DndProvider>
                    </Grid>
                )}
            </FieldArray>
        </Grid>
    );
};

export { AddStepsFields, addStepsFieldsSchema };
