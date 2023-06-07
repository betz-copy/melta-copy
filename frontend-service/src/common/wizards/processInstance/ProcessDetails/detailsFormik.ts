import { useFormik } from 'formik';
import * as Yup from 'yup';
import { IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { IMongoProcessInstancePopulated } from '../../../../interfaces/processes/processInstance';
import i18next from 'i18next';
import { ProcessDetailsValues } from '.';
import { getStepsObjectPopulated } from '../../../../utils/processWizard/steps';
import { splitFilesProperties } from '../../../../utils/processWizard/formik';
import { useMemo } from 'react';

const validationSchema = Yup.object().shape({
    name: Yup.string().nullable().required(i18next.t('validation.required')),
    template: Yup.object().nullable().required(i18next.t('validation.required')),
    startDate: Yup.date().nullable().required(i18next.t('validation.required')),
    endDate: Yup.date().nullable().required(i18next.t('validation.required')),
    steps: Yup.object().nullable().required('This field is required'),
});

export const getInitialDetailsValues = (
    processInstance: IMongoProcessInstancePopulated | undefined,
    processTemplatesMap: IProcessTemplateMap,
): ProcessDetailsValues => {
    if (processInstance) {
        const { fieldProperties, fileProperties } = splitFilesProperties(
            processTemplatesMap.get(processInstance.templateId)!,
            processInstance,
            'details.properties.properties',
        );
        return {
            template: processTemplatesMap.get(processInstance.templateId)!,
            name: processInstance.name,
            startDate: new Date(processInstance.startDate),
            endDate: new Date(processInstance.endDate),
            details: fieldProperties,
            detailsAttachments: fileProperties,
            steps: getStepsObjectPopulated(processInstance.steps),
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
    };
};

export const useProcessDetailsFormik = (
    processInstance: IMongoProcessInstancePopulated | undefined,
    processTemplatesMap: IProcessTemplateMap,
    mutateAsync: (data: ProcessDetailsValues) => Promise<any>,
) => {
    const initialValues = useMemo(() => getInitialDetailsValues(processInstance, processTemplatesMap), [processInstance, processTemplatesMap]);
    const formik = useFormik<ProcessDetailsValues>({
        initialValues: initialValues,
        onSubmit: async (values: ProcessDetailsValues, { resetForm }) => {
            const result = await mutateAsync(values);
            if (processInstance) resetForm({ values: getInitialDetailsValues(result, processTemplatesMap) }); // in order to clean dirty + reset file keys to be downloaded
        },
        validationSchema: validationSchema,
        validateOnMount: true,
    });

    return formik;
};
