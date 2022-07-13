import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Button, Grid, Typography } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { FieldArray } from 'formik';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQuery, useQueryClient } from 'react-query';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { v4 as uuid } from 'uuid';
import { entityTemplateUniqueProperties, regexSchema, variableNameValidation } from '../../../utils/validation';
import { EntityTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';
import { getEntitiesByTemplateRequest } from '../../../services/entitiesService';
import FieldEditCard from './FieldEditCard';
import AttachmentEditCard from './AttachmentEditCard';
import { basePropertyTypes, stringFormats } from '../../../services/templates/enitityTemplatesService';

const validPropertyTypes = [...basePropertyTypes, ...stringFormats, 'pattern', 'enum'];

const addFieldsSchema = Yup.object({
    properties: Yup.array()
        .of(
            Yup.object({
                name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
                title: Yup.string().required(i18next.t('validation.required')),
                type: Yup.string().oneOf(validPropertyTypes, i18next.t('validation.invalidPropertyType')).required(i18next.t('validation.required')),
                required: Yup.boolean().required(i18next.t('validation.required')),
                preview: Yup.boolean().required(i18next.t('validation.required')),
                options: Yup.array(Yup.string()).when('type', { is: 'enum', then: (schema) => schema.min(1, i18next.t('validation.required')) }),
                pattern: regexSchema.when('type', { is: 'pattern', then: (schema) => schema.required(i18next.t('validation.required')) }),
                patternCustomErrorMessage: Yup.string().when('type', {
                    is: 'pattern',
                    then: (schema) => schema.required(i18next.t('validation.required')),
                }),
            }),
        )
        .min(1, i18next.t('validation.oneField'))
        .required(i18next.t('validation.required')),
    attachmentProperties: Yup.array().of(
        Yup.object({
            name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
            title: Yup.string().required(i18next.t('validation.required')),
            required: Yup.boolean().required(i18next.t('validation.required')),
        }),
    ),
}).test('uniqueProperties', entityTemplateUniqueProperties);

const AddFields: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({
    values,
    touched,
    errors,
    setFieldValue,
    handleChange,
    handleBlur,
    isEditMode,
    initialValues,
}) => {
    const queryClient = useQueryClient();

    useQuery(
        ['isThereInstancesByTemplateId', (values as EntityTemplateWizardValues & { _id: string })._id],
        () =>
            getEntitiesByTemplateRequest((values as EntityTemplateWizardValues & { _id: string })._id, {
                startRow: 0,
                endRow: 0,
                filterModel: {},
                sortModel: [],
            }),
        {
            enabled: isEditMode,
            initialData: { lastRowIndex: 1, rows: [] },
        },
    );

    const areThereAnyInstances =
        queryClient.getQueryData<{ lastRowIndex: number }>([
            'isThereInstancesByTemplateId',
            (values as EntityTemplateWizardValues & { _id: string })._id,
        ])!.lastRowIndex > 0;

    return (
        <>
            <Accordion
                style={{
                    width: '100%',
                    boxShadow: '1px 1px 10px 2px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
                    marginBottom: '10px',
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{i18next.t('wizard.entityTemplate.properties')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FieldArray name="properties" validateOnChange={false}>
                        {({ push, remove, move }) => (
                            <DragDropContext onDragEnd={(result) => result.destination && move(result.source.index, result.destination.index)}>
                                <Droppable droppableId="fieldArea">
                                    {(droppableProvided) => (
                                        <Grid
                                            container
                                            ref={droppableProvided.innerRef}
                                            {...droppableProvided.droppableProps}
                                            direction="column"
                                            alignItems="center"
                                        >
                                            {values.properties.map((property, index) => (
                                                <FieldEditCard
                                                    key={property.id}
                                                    value={property}
                                                    index={index}
                                                    isEditMode={isEditMode}
                                                    initialValues={initialValues}
                                                    areThereAnyInstances={areThereAnyInstances}
                                                    touched={touched}
                                                    errors={errors}
                                                    handleChange={handleChange}
                                                    handleBlur={handleBlur}
                                                    remove={remove}
                                                    setFieldValue={setFieldValue}
                                                />
                                            ))}

                                            {droppableProvided.placeholder}

                                            <Button
                                                type="button"
                                                variant="contained"
                                                style={{ margin: '8px' }}
                                                onClick={() =>
                                                    push({
                                                        id: uuid(),
                                                        name: '',
                                                        title: '',
                                                        type: '',
                                                        required: false,
                                                        preview: false,
                                                        options: [],
                                                        pattern: '',
                                                        patternCustomErrorMessage: '',
                                                    })
                                                }
                                            >
                                                {i18next.t('wizard.entityTemplate.addProperty')}
                                            </Button>

                                            {errors.properties === i18next.t('validation.oneField') && (
                                                <div style={{ color: '#d32f2f' }}>{i18next.t('validation.oneField')}</div>
                                            )}
                                        </Grid>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </FieldArray>
                </AccordionDetails>
            </Accordion>
            <Accordion
                style={{
                    width: '100%',
                    boxShadow: '1px 1px 10px 2px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{i18next.t('wizard.entityTemplate.attachments')}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FieldArray name="attachmentProperties">
                        {({ push, remove, move }) => (
                            <DragDropContext onDragEnd={(result) => result.destination && move(result.source.index, result.destination.index)}>
                                <Droppable droppableId="fieldArea">
                                    {(droppableProvided) => (
                                        <Grid
                                            container
                                            ref={droppableProvided.innerRef}
                                            {...droppableProvided.droppableProps}
                                            direction="column"
                                            alignItems="center"
                                        >
                                            {values.attachmentProperties.map((property, index) => (
                                                <AttachmentEditCard
                                                    key={property.id}
                                                    value={property}
                                                    index={index}
                                                    isEditMode={isEditMode}
                                                    initialValues={initialValues}
                                                    areThereAnyInstances={areThereAnyInstances}
                                                    touched={touched}
                                                    errors={errors}
                                                    handleChange={handleChange}
                                                    remove={remove}
                                                />
                                            ))}

                                            {droppableProvided.placeholder}

                                            <Button
                                                type="button"
                                                variant="contained"
                                                style={{ margin: '8px' }}
                                                onClick={() => push({ id: uuid(), name: '', title: '', type: 'fileId', required: false })}
                                            >
                                                {i18next.t('wizard.entityTemplate.addAttachment')}
                                            </Button>
                                        </Grid>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </FieldArray>
                </AccordionDetails>
            </Accordion>
        </>
    );
};

export { AddFields, addFieldsSchema, validPropertyTypes };
