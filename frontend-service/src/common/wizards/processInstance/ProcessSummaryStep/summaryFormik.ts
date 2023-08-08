import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMemo } from 'react';
import { IProcessTemplateMap } from '../../../../interfaces/processes/processTemplate';
import { IMongoProcessInstancePopulated } from '../../../../interfaces/processes/processInstance';
import { SummaryDetailsValues } from '.';
import { splitSpacialProperties } from '../../../../utils/processWizard/formik';

const validationSchema = Yup.object().shape({}); // TODO

export const getInitialSummaryValues = (
    processInstance: IMongoProcessInstancePopulated,
    processTemplatesMap: IProcessTemplateMap,
): SummaryDetailsValues => {
    const { fieldProperties, entityProperties, fileProperties } = splitSpacialProperties(
        processTemplatesMap.get(processInstance.templateId)!,
        processInstance,
        'summaryDetails.properties.properties',
    );
    return {
        summaryDetails: fieldProperties,
        summaryAttachments: fileProperties,
        status: processInstance.status,
        entityReferences: entityProperties,
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
