import React from 'react';
import { Grid } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQuery } from 'react-query';
import { AxiosError } from 'axios';
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
const dateNotificationTypes: string[] = ['day', 'week', 'twoWeeks'];
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
                dateNotification: Yup.string().nullable().oneOf(dateNotificationTypes, i18next.t('validation.mustBeOneOfList')),
                serialStarter: Yup.number()
                    .typeError(i18next.t('validation.invalidNumberField'))
                    .when('type', {
                        is: 'serialNumber',
                        then: (schema) => schema.min(0, i18next.t('validation.invalidSerialStarter')).required(i18next.t('validation.required')),
                    }),
            }),
        )
        .min(1, i18next.t('validation.oneField')),
    attachmentProperties: Yup.array().of(
        attachmentPropertiesBaseSchema.shape({
            required: Yup.boolean().required(i18next.t('validation.required')),
        }),
    ),
}).test('uniqueProperties', entityTemplateUniqueProperties);

const AddFields: React.FC<StepComponentProps<EntityTemplateWizardValues, 'isEditMode' | 'setBlock'>> = ({
    values,
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

    return (
        <Grid container direction="column" alignItems="stretch" spacing={1}>
            <Grid item>
                <FieldBlock
                    propertiesType="properties"
                    values={values}
                    initialValues={initialValues}
                    setFieldValue={setFieldValue}
                    areThereAnyInstances={areThereAnyInstances}
                    isEditMode={isEditMode}
                    setBlock={setBlock}
                    title={i18next.t('wizard.entityTemplate.properties')}
                    addPropertyButtonLabel={i18next.t('wizard.entityTemplate.addProperty')}
                    touched={touched}
                    errors={errors}
                    supportSerialNumberType
                    supportEntityReferenceType={false}
                    supportChangeToRequiredWithInstances
                    supportArrayFields
                />
            </Grid>

            <Grid item>
                <FieldBlock
                    propertiesType="attachmentProperties"
                    values={values}
                    initialValues={initialValues}
                    setFieldValue={setFieldValue}
                    areThereAnyInstances={areThereAnyInstances}
                    isEditMode={isEditMode}
                    setBlock={setBlock}
                    title={i18next.t('wizard.entityTemplate.attachments')}
                    addPropertyButtonLabel={i18next.t('wizard.entityTemplate.addAttachment')}
                    touched={touched}
                    errors={errors}
                    supportSerialNumberType
                    supportEntityReferenceType={false}
                    supportChangeToRequiredWithInstances
                    supportArrayFields
                />
            </Grid>
        </Grid>
    );
};

export { AddFields, addFieldsSchema, validPropertyTypes, dateNotificationTypes };
