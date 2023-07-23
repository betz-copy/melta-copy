import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMemo } from 'react';
import { IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { IMongoProcessInstancePopulated } from '../../../../interfaces/processes/processInstance';
import { SummaryDetailsValues } from '.';
import { splitFilesProperties } from '../../../../utils/processWizard/formik';

const validationSchema = Yup.object().shape({}); // TODO

export const getInitialSummaryValues = (
    processInstance: IMongoProcessInstancePopulated,
    processTemplatesMap: IProcessTemplateMap,
): SummaryDetailsValues => {
    return {
        summaryDetails: splitFilesProperties(
            processTemplatesMap.get(processInstance.templateId)!,
            processInstance,
            'summaryDetails.properties.properties',
        ).fieldProperties,
        summaryAttachments: splitFilesProperties(
            processTemplatesMap.get(processInstance.templateId)!,
            processInstance,
            'summaryDetails.properties.properties',
        ).fileProperties,
        status: processInstance.status,
    };
};

export const useProcessSummaryFormik = (
    processInstance: IMongoProcessInstancePopulated,
    processTemplatesMap: IProcessTemplateMap,
    mutateAsync: (data: SummaryDetailsValues) => Promise<any>,
) => {
    const initialValues = useMemo(() => getInitialSummaryValues(processInstance, processTemplatesMap), [processInstance, processTemplatesMap]);
    const formik = useFormik<SummaryDetailsValues>({
        initialValues,
        onSubmit: (values: SummaryDetailsValues, { resetForm }) => {
            mutateAsync(values).then((result) => {
                resetForm({ values: getInitialSummaryValues(result, processTemplatesMap) });
            });
        },
        validationSchema,
        validateOnMount: true,
    });

    return formik;
};
