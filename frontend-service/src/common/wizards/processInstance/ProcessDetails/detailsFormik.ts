import { AxiosError } from 'axios';
import { useFormik, yupToFormErrors } from 'formik';
import i18next from 'i18next';
import { useMemo } from 'react';
import { UseMutateAsyncFunction } from 'react-query';
import * as Yup from 'yup';
import { IMongoProcessInstancePopulated } from '../../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated, IProcessDetails, IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { pickProcessFieldsPropertiesSchema } from '../../../../utils/pickFieldsPropertiesSchema';
import { splitSpacialProperties } from '../../../../utils/processWizard/formik';
import { getStepsObjectPopulated } from '../../../../utils/processWizard/steps';
import { tryCatch } from '../../../../utils/tryCatch';
import { ajvValidate } from '../../../inputs/JSONSchemaFormik';
import { ProcessDetailsValues } from '.';

const validationSchema = Yup.object().shape({
    name: Yup.string().nullable().required(i18next.t('validation.required')),
    template: Yup.object().nullable().required(i18next.t('validation.required')),
    startDate: Yup.date().nullable().required(i18next.t('validation.required')),
    endDate: Yup.date().nullable().required(i18next.t('validation.required')),
    steps: Yup.object().nullable().required('This field is required'),
});

export const initDetailsValues = (template: IMongoProcessTemplatePopulated): object => {
    const details = {};
    Object.keys(template.details.properties.properties).forEach((field) => {
        details[field] = undefined;
    });
    return details;
};

export const getInitialDetailsValues = (
    processInstance: IMongoProcessInstancePopulated | undefined,
    processTemplatesMap: IProcessTemplateMap,
): ProcessDetailsValues => {
    if (processInstance) {
        const { fieldProperties, fileProperties, entityProperties } = splitSpacialProperties(
            processTemplatesMap.get(processInstance.templateId)!,
            processInstance,
            'details.properties.properties',
        );
        return {
            template: processTemplatesMap.get(processInstance.templateId)!,
            name: processInstance.name,
            startDate: new Date(processInstance.startDate),
            endDate: new Date(processInstance.endDate),
            details: fieldProperties || initDetailsValues(processTemplatesMap.get(processInstance.templateId)!),
            detailsAttachments: fileProperties,
            steps: getStepsObjectPopulated(processInstance.steps),
            entityReferences: entityProperties,
        };
    }

    return {
        template: null,
        name: '',
        startDate: null,
        endDate: null,
        details: {},
        detailsAttachments: {},
        steps: {},
        entityReferences: {},
    };
};

export const getValidationErrors = async (values) => {
    const { err: validationSchemaErr } = await tryCatch(() => validationSchema.validate(values, { abortEarly: false }));
    const validationSchemaErrors = !validationSchemaErr ? {} : yupToFormErrors<IProcessDetails>(validationSchemaErr);

    if (!values?.template?.details) {
        return validationSchemaErrors;
    }

    const schema = pickProcessFieldsPropertiesSchema(values.template.details);
    const ajvErrors = ajvValidate(schema, values.details);

    if (Object.keys(ajvErrors).length === 0) return validationSchemaErrors;

    return { details: ajvErrors, ...validationSchemaErrors };
};

export const useProcessDetailsFormik = (
    processInstance: IMongoProcessInstancePopulated | undefined,
    processTemplatesMap: IProcessTemplateMap,
    mutateAsync: UseMutateAsyncFunction<IMongoProcessInstancePopulated, AxiosError, ProcessDetailsValues, unknown>,
) => {
    const initialValues = useMemo(() => getInitialDetailsValues(processInstance, processTemplatesMap), [processInstance, processTemplatesMap]);
    const formik = useFormik<ProcessDetailsValues>({
        initialValues,
        onSubmit: async (values: ProcessDetailsValues, { resetForm }) => {
            const result = await mutateAsync(values);
            if (processInstance) resetForm({ values: getInitialDetailsValues(result, processTemplatesMap) }); // in order to clean dirty + reset file keys to be downloaded
        },
        validate: getValidationErrors,
        validateOnMount: true,
    });
    return formik;
};
