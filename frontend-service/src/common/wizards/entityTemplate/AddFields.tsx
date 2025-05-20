import React, { useCallback, useEffect, useRef } from 'react';
import { Grid } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQuery } from 'react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import { FormikProps } from 'formik';
import { entityTemplateUniqueProperties, regexSchema, variableNameValidation } from '../../../utils/validation';
import { EntityTemplateWizardValues } from './index';
import { StepComponentHelpers, StepComponentProps } from '../index';
import { searchEntitiesOfTemplateRequest } from '../../../services/entitiesService';
import { arrayTypes, basePropertyTypes, stringFormats } from '../../../services/templates/enitityTemplatesService';
import { ErrorToast } from '../../ErrorToast';
import { environment } from '../../../globals';
import { ItemTypes, FieldBlockDND } from './FieldBlock';
import { PropertyItem } from './commonInterfaces';

const { mapSearchPropertiesLimit } = environment.map;

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
    type: Yup.string().required(i18next.t('validation.required')),
});

const extendedPropertySchema = propertiesBaseSchema.shape({
    required: Yup.boolean().required(i18next.t('validation.required')),
    preview: Yup.boolean().required(i18next.t('validation.required')),
    dateNotification: Yup.number().nullable().oneOf([1, 7, 14, 30, 90, 180], i18next.t('validation.mustBeOneOfList')),
    serialStarter: Yup.number()
        .typeError(i18next.t('validation.invalidNumberField'))
        .when('type', {
            is: 'serialNumber',
            then: (schema) => schema.min(0, i18next.t('validation.invalidSerialStarter')).required(i18next.t('validation.required')),
        }),
    relationshipReference: Yup.object().when('type', {
        is: 'relationshipReference',
        then: Yup.object({
            relatedTemplateId: Yup.string().required(i18next.t('validation.required')),
            relatedTemplateField: Yup.string().required(i18next.t('validation.required')),
            relationshipTemplateDirection: Yup.string().required(i18next.t('validation.required')),
        }),
    }),
    expandedUserField: Yup.object().when('type', {
        is: 'kartoffelUserField',
        then: Yup.object({
            relatedUserField: Yup.string().required(i18next.t('validation.required')),
            kartoffelField: Yup.string().required(i18next.t('validation.required')),
        }),
    }),
    mapSearch: Yup.boolean(),
    comment: Yup.string().when('type', {
        is: 'comment',
        then: Yup.string().required(),
    }),
});

const fieldSchema = Yup.object({
    type: Yup.string().oneOf(['field']).required(),
    data: extendedPropertySchema.required(),
});

const groupSchema = Yup.object({
    type: Yup.string().oneOf(['group']).required(),
    name: Yup.string().matches(variableNameValidation, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    displayName: Yup.string().required(i18next.t('validation.required')),
    fields: Yup.array()
        .of(extendedPropertySchema)
        .min(1, i18next.t('validation.oneField'))
        .test('hasNonArchivedFields', i18next.t('validation.oneField'), (entries) => {
            if (!entries) return false;
            return entries.some((item: any) => {
                return item.archive !== true;
            });
        }),
});
const fieldByTypeSchema = Yup.lazy((item: any): Yup.BaseSchema => {
    if (item?.type === 'field') return fieldSchema;
    if (item?.type === 'group') return groupSchema;
    return Yup.mixed().notRequired();
});

const propertiesSchema = Yup.array()
    .of(fieldByTypeSchema as any)
    .min(1, i18next.t('validation.oneField'))
    .test('hasActiveFields', i18next.t('validation.oneField'), (entries) => {
        if (!entries) return false;
        return entries.some((item) => {
            if (item.type === 'field') return !item.data?.deleted;
            if (item.type === 'group') return item.fields?.some((f) => !f.deleted);
            return false;
        });
    })
    .test('hasNonArchivedFields', i18next.t('validation.oneField'), (entries) => {
        if (!entries) return false;
        return entries.some((item) => {
            if (item.type === 'field') return item.data?.archive !== true;
            if (item.type === 'group') return item.fields?.some((f) => f.archive !== true);
            return false;
        });
    })
    .test('mapSearchLimit', i18next.t('validation.mapSearchPropertiesLimit', { limit: mapSearchPropertiesLimit }), (entries) => {
        if (!entries) return true;
        let count = 0;
        for (const item of entries) {
            if (item.type === 'field' && item.data?.mapSearch) count++;
            if (item.type === 'group') {
                count += item.fields?.filter((f) => f.mapSearch).length || 0;
            }
        }
        if (count > mapSearchPropertiesLimit) {
            toast.error(i18next.t('validation.mapSearchPropertiesLimit', { limit: mapSearchPropertiesLimit }));
        }
        return count <= mapSearchPropertiesLimit;
    });

const addFieldsSchema = Yup.object({
    properties: propertiesSchema,
    attachmentProperties: Yup.array().of(
        Yup.object({
            type: Yup.string().oneOf(['field']).required(),
            data: attachmentPropertiesBaseSchema.shape({
                required: Yup.boolean().required(i18next.t('validation.required')),
            }),
        }),
    ),
}).test('uniqueProperties', entityTemplateUniqueProperties);

type AddFieldsDNDProps = Pick<
    FormikProps<EntityTemplateWizardValues>,
    'values' | 'setValues' | 'touched' | 'errors' | 'setFieldValue' | 'initialValues'
> &
    Pick<StepComponentHelpers, 'isEditMode' | 'setBlock'>;

export const FieldBlockWrapper = ({
    itemId,
    index,
    moveItem,
    values,
    setValues,
    touched,
    errors,
    setFieldValue,
    initialValues,
    isEditMode,
    setBlock,
}) => {
    const hasActions = Boolean(initialValues?.actions);
    const countMapSearchProperties = Object.values(values.properties).flatMap((property: any) => {
        if (property.type === 'field' && property.data?.mapSearch) {
            return [property];
        }
        if (property.type === 'group' && Array.isArray(property.fields)) {
            return property.fields.filter((field) => field.mapSearch);
        }
        return [];
    }).length;

    if (countMapSearchProperties > mapSearchPropertiesLimit) setBlock(true);

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
                console.error('failed to check areThereInstancesByTemplateId. error:', error);
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('systemManagement.defaultCantEdit')} />);
            },
        },
    );
    const areThereAnyInstances = isEditMode && areThereInstancesByTemplateIdResponse!.count > 0;

    const getTitle = (id: string): string => {
        const titles: Record<string, string> = {
            properties: i18next.t('wizard.entityTemplate.properties'),
            attachmentProperties: i18next.t('wizard.entityTemplate.attachments'),
            archiveProperties: i18next.t('wizard.entityTemplate.archiveProperties'),
        };

        return titles[id] || '';
    };

    const ref = useRef<HTMLDivElement | null>(null);

    const [, drop] = useDrop({
        accept: ItemTypes.PROPERTY,
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
            // eslint-disable-next-line no-param-reassign
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type: ItemTypes.PROPERTY,
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
                <FieldBlockDND
                    propertiesType={itemId}
                    values={values}
                    uniqueConstraints={values.uniqueConstraints}
                    setUniqueConstraints={(newUniqueConstraints) => {
                        setValues((prev) => ({
                            ...prev,
                            uniqueConstraints:
                                typeof newUniqueConstraints === 'function' ? newUniqueConstraints(prev.uniqueConstraints!) : newUniqueConstraints,
                        }));
                    }}
                    initialValues={initialValues}
                    setFieldValue={setFieldValue}
                    areThereAnyInstances={areThereAnyInstances}
                    isEditMode={isEditMode}
                    setBlock={setBlock}
                    title={getTitle(itemId)}
                    addPropertyButtonLabel={
                        itemId === 'properties' ? i18next.t('wizard.entityTemplate.addProperty') : i18next.t('wizard.entityTemplate.addAttachment')
                    }
                    touched={touched}
                    errors={errors}
                    supportSerialNumberType
                    supportUserType
                    supportEntityReferenceType={false}
                    supportChangeToRequiredWithInstances
                    supportRelationshipReference
                    supportArrayFields
                    supportDeleteForExistingInstances
                    supportEditEnum
                    supportUnique
                    supportLocation
                    supportArchive
                    supportComment
                    supportAddFieldButton={itemId === 'attachmentProperties' || itemId === 'properties'}
                    hasActions={hasActions}
                    draggable={{ isDraggable: true }}
                    locationSearchFields={{
                        show: (Object.values(values.properties) as PropertyItem[]).some((property) => {
                            if (property.type === 'field') {
                                return property.data.type === 'location';
                            }
                            if (property.type === 'group') {
                                return property.fields.some((field) => field.type === 'location');
                            }
                            return false;
                        }),
                        disabled: countMapSearchProperties >= 2,
                    }}
                    supportIdentifier
                    hasIdentifier={(Object.values(values.properties) as PropertyItem[]).some((property) => {
                        if (property.type === 'field') {
                            return 'identifier' in property.data && Boolean(property.data.identifier);
                        }
                        if (property.type === 'group') {
                            return property.fields.some((field) => 'identifier' in field && Boolean(field.identifier));
                        }
                        return false;
                    })}
                />
            </div>
        </Grid>
    );
};

export const AddFieldsDND: React.FC<AddFieldsDNDProps> = ({
    values,
    setValues,
    touched,
    errors,
    setFieldValue,
    initialValues,
    isEditMode,
    setBlock,
}) => {
    const moveItem = useCallback(
        (dragIndex, hoverIndex) => {
            const newValuesOrder = Array.from(values.propertiesTypeOrder);
            const [movedOption] = newValuesOrder.splice(dragIndex, 1);
            newValuesOrder.splice(hoverIndex, 0, movedOption);

            setFieldValue('propertiesTypeOrder', newValuesOrder);
        },
        [values.propertiesTypeOrder],
    );

    return (
        <Grid container direction="column" alignItems="center" style={{ minHeight: '160px' }}>
            {values.propertiesTypeOrder.map((itemId, index) => (
                <FieldBlockWrapper
                    key={itemId}
                    index={index}
                    itemId={itemId}
                    moveItem={moveItem}
                    values={values}
                    setValues={setValues}
                    touched={touched}
                    errors={errors}
                    setFieldValue={setFieldValue}
                    initialValues={initialValues}
                    isEditMode={isEditMode}
                    setBlock={setBlock}
                />
            ))}
        </Grid>
    );
};

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
    return (
        <DndProvider backend={HTML5Backend}>
            <AddFieldsDND
                values={values}
                setValues={setValues}
                touched={touched}
                errors={errors}
                setFieldValue={setFieldValue}
                initialValues={initialValues}
                isEditMode={isEditMode}
                setBlock={setBlock}
            />
        </DndProvider>
    );
};

export { AddFields, addFieldsSchema, validPropertyTypes, dateNotificationTypes };
