import React from 'react';
import { Button, Grid } from '@mui/material';
import { FieldArray } from 'formik';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQuery, useQueryClient } from 'react-query';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { v4 as uuid } from 'uuid';
import { variableNameValidation } from '../../../utils/validation';
import { EntityTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';
import { getEntitiesByTemplateRequest } from '../../../services/entitiesService';
import FieldEditCard from './FieldEditCard';

const basePropertyTypes = ['string', 'number', 'boolean'];
const stringTypes = ['date', 'date-time', 'email'];
const validPropertyTypes = [...basePropertyTypes, ...stringTypes];

const addFieldsSchema = {
    properties: Yup.array()
        .of(
            Yup.object({
                name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
                title: Yup.string().required(i18next.t('validation.required')),
                type: Yup.string().oneOf(validPropertyTypes, i18next.t('validation.invalidPropertyType')).required(i18next.t('validation.required')),
                required: Yup.boolean().required(i18next.t('validation.required')),
                preview: Yup.boolean().required(i18next.t('validation.required')),
            }),
        )
        .min(1, i18next.t('validation.oneField'))
        .required(i18next.t('validation.required')),
};

const AddFields: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({
    values,
    touched,
    errors,
    handleChange,
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
            initialData: { lastRowIndex: 0, rows: [] },
        },
    );

    const areThereAnyInstances =
        queryClient.getQueryData<{ lastRowIndex: number }>([
            'isThereInstancesByTemplateId',
            (values as EntityTemplateWizardValues & { _id: string })._id,
        ])!.lastRowIndex > 0;

    return (
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
                                maxWidth="80%"
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
                                        remove={remove}
                                    />
                                ))}

                                {droppableProvided.placeholder}

                                <Button
                                    type="button"
                                    variant="contained"
                                    style={{ margin: '8px' }}
                                    onClick={() => push({ id: uuid(), name: '', title: '', type: '', required: false, preview: false })}
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
    );
};

export { AddFields, addFieldsSchema, validPropertyTypes };
