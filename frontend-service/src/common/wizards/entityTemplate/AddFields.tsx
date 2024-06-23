import React from 'react';
import { Grid } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQuery } from 'react-query';
import { AxiosError } from 'axios';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import { entityTemplateUniqueProperties, regexSchema, variableNameValidation } from '../../../utils/validation';
import { EntityTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';
import { searchEntitiesOfTemplateRequest } from '../../../services/entitiesService';
import { arrayTypes, basePropertyTypes, stringFormats } from '../../../services/templates/enitityTemplatesService';
import FieldBlock from './FieldBlock';
import { ErrorToast } from '../../ErrorToast';

const processStringFormats = [...stringFormats, 'entityReference'];
const validPropertyTypes = [...basePropertyTypes, ...processStringFormats, ...arrayTypes, 'enum', 'serialNumber', 'pattern'];
const dateNotificationTypes: string[] = ['day', 'week', 'twoWeeks', 'month', 'threeMonths', 'halfYear'];
export const propertiesBaseSchema = Yup.object({
    name: Yup.string()
        .notOneOf(['createdAt', 'updatedAt', 'disable'], i18next.t('validation.fieldExist'))
        .matches(variableNameValidation, i18next.t('validation.variableName'))
        .required(i18next.t('validation.required')),
    title: Yup.string()
        .notOneOf(['תאריך יצירה', 'תאריך עדכון', 'מושבת'], i18next.t('validation.fieldExist'))
        .required(i18next.t('validation.required')),
    type: Yup.string().required(i18next.t('validation.required')),
    options: Yup.array(Yup.string()).when('type', {
        is: (type) => type === 'enum' || type === 'enumArray',
        then: (schema) => schema.min(1, i18next.t('validation.required')),
    }),
    pattern: regexSchema.when('type', { is: 'pattern', then: (schema) => schema.required(i18next.t('validation.required')) }),
    patternCustomErrorMessage: Yup.string().when('type', {
        is: 'pattern',
        then: (schema) => schema.required(i18next.t('validation.required')),
    }),
    groupName: Yup.string().when('uniqueCheckbox', { is: true, then: (schema) => schema.required(i18next.t('validation.mustSelectUniqueGroup')) }),
});

export const attachmentPropertiesBaseSchema = Yup.object({
    name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    title: Yup.string().required(i18next.t('validation.required')),
});

const addFieldsSchema = Yup.object({
    properties: Yup.array()
        .of(
            propertiesBaseSchema.shape({
                required: Yup.boolean().required(i18next.t('validation.required')),
                preview: Yup.boolean().required(i18next.t('validation.required')),
                dateNotification: Yup.number().nullable().oneOf([1, 7, 14, 30, 90, 180], i18next.t('validation.mustBeOneOfList')),
                serialStarter: Yup.number()
                    .typeError(i18next.t('validation.invalidNumberField'))
                    .when('type', {
                        is: 'serialNumber',
                        then: (schema) => schema.min(0, i18next.t('validation.invalidSerialStarter')).required(i18next.t('validation.required')),
                    }),
            }),
        )
        .min(1, i18next.t('validation.oneField'))
        .test(i18next.t('validation.oneField'), i18next.t('validation.oneField'), (value) => {
            if (!value) {
                return false;
            }
            return value.some((obj) => !('deleted' in obj) || obj.deleted === false);
        }),

    attachmentProperties: Yup.array().of(
        attachmentPropertiesBaseSchema.shape({
            required: Yup.boolean().required(i18next.t('validation.required')),
        }),
    ),
}).test('uniqueProperties', entityTemplateUniqueProperties);

const AddFields: React.FC<StepComponentProps<EntityTemplateWizardValues, 'isEditMode' | 'setBlock'>> = ({
    values,
    setValues,
    touched,
    errors,
    setFieldValue,
    initialValues,
    isEditMode,
    setBlock,
}) => {
    const { data: areThereInstancesByTemplateIdResponse } = useQuery(
        ['areThereInstancesByTemplateId', (values as EntityTemplateWizardValues & { _id: string })._id],
        () =>
            searchEntitiesOfTemplateRequest((values as EntityTemplateWizardValues & { _id: string })._id, {
                skip: 0,
                limit: 1,
            }),
        {
            enabled: isEditMode,
            initialData: { count: 1, entities: [] },
            onError: (error: AxiosError) => {
                // eslint-disable-next-line no-console
                console.log('failed to check areThereInstancesByTemplateId. error:', error);
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('systemManagement.defaultCantEdit')} />);
            },
        },
    );
    const areThereAnyInstances = isEditMode && areThereInstancesByTemplateIdResponse!.count > 0;

    const onDragEnd = (result: DropResult) => {
        const { destination, source } = result;
        if (!destination) return;

        const newPropertiesTypeOrder = Array.from(values.propertiesTypeOrder);
        const [movedOption] = newPropertiesTypeOrder.splice(source.index, 1);
        newPropertiesTypeOrder.splice(destination.index, 0, movedOption);

        setFieldValue('propertiesTypeOrder', newPropertiesTypeOrder);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="propertiesArea">
                {(provided) => (
                    <Grid
                        container
                        direction="column"
                        alignItems="center"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{ minHeight: '160px' }}
                    >
                        {values.propertiesTypeOrder.map((itemId, index) => (
                            <Draggable key={itemId} draggableId={itemId} index={index}>
                                {(draggableProvided) => (
                                    <Grid
                                        item
                                        ref={draggableProvided.innerRef}
                                        {...draggableProvided.draggableProps}
                                        alignSelf="stretch"
                                        marginBottom="1rem"
                                    >
                                        <FieldBlock
                                            propertiesType={itemId}
                                            values={values}
                                            uniqueConstraints={values.uniqueConstraints}
                                            setUniqueConstraints={(newUniqueConstraints) => {
                                                setValues((prev) => ({
                                                    ...prev,
                                                    uniqueConstraints:
                                                        typeof newUniqueConstraints === 'function'
                                                            ? newUniqueConstraints(prev.uniqueConstraints!)
                                                            : newUniqueConstraints,
                                                }));
                                            }}
                                            initialValues={initialValues}
                                            setFieldValue={setFieldValue}
                                            areThereAnyInstances={areThereAnyInstances}
                                            isEditMode={isEditMode}
                                            setBlock={setBlock}
                                            title={
                                                itemId === 'properties'
                                                    ? i18next.t('wizard.entityTemplate.properties')
                                                    : i18next.t('wizard.entityTemplate.attachments')
                                            }
                                            addPropertyButtonLabel={
                                                itemId === 'properties'
                                                    ? i18next.t('wizard.entityTemplate.addProperty')
                                                    : i18next.t('wizard.entityTemplate.addAttachment')
                                            }
                                            touched={touched}
                                            errors={errors}
                                            supportSerialNumberType
                                            supportEntityReferenceType={false}
                                            supportChangeToRequiredWithInstances
                                            supportArrayFields
                                            supportDeleteForExistingInstances
                                            supportEditEnum
                                            draggable={{ isDraggable: true, dragHandleProps: draggableProvided.dragHandleProps }}
                                        />
                                    </Grid>
                                )}
                            </Draggable>
                        ))}
                    </Grid>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export { AddFields, addFieldsSchema, validPropertyTypes, dateNotificationTypes };
