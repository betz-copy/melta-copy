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
import { getEntitiesByTemplateRequest } from '../../../services/entitiesService';
import { basePropertyTypes, stringFormats } from '../../../services/templates/enitityTemplatesService';
import FieldBlock from './FieldBlock';
import { ErrorToast } from '../../ErrorToast';

const validPropertyTypes = [...basePropertyTypes, ...stringFormats, 'pattern', 'enum'];
export const propertiesBaseSchema = Yup.object({
    name: Yup.string()
        .notOneOf(['createdAt', 'updatedAt', 'disable'], i18next.t('validation.fieldExist'))
        .matches(variableNameValidation, i18next.t('validation.variableName'))
        .required(i18next.t('validation.required')),
    title: Yup.string()
        .notOneOf(['תאריך יצירה', 'תאריך עדכון', 'מושבת'], i18next.t('validation.fieldExist'))
        .required(i18next.t('validation.required')),
    type: Yup.string().oneOf(validPropertyTypes, i18next.t('validation.invalidPropertyType')).required(i18next.t('validation.required')),
    options: Yup.array(Yup.string()).when('type', {
        is: 'enum',
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
            getEntitiesByTemplateRequest([(values as EntityTemplateWizardValues & { _id: string })._id], {
                startRow: 0,
                endRow: 0,
                filterModel: {},
                sortModel: [],
            }),
        {
            enabled: isEditMode,
            initialData: { lastRowIndex: 1, rows: [] },
            onError: (error: AxiosError) => {
                // eslint-disable-next-line no-console
                console.log('failed to check areThereInstancesByTemplateId. error:', error);

                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('systemManagement.defaultCantEdit')} />);
            },
        },
    );

    const areThereAnyInstances = areThereInstancesByTemplateIdResponse!.lastRowIndex > 0;

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
                />
            </Grid>
        </Grid>
    );
};

export { AddFields, addFieldsSchema, validPropertyTypes };
