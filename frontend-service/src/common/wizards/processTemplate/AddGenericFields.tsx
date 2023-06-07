import React from 'react';
import { Grid } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQuery } from 'react-query';
import { FormikTouched, FormikErrors } from 'formik';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ProcessTemplateWizardValues } from './index';
import { searchProcessesRequest } from '../../../services/processesService';
import { attachmentPropertiesBaseSchema, propertiesBaseSchema } from '../entityTemplate/AddFields';
import FieldBlock from '../entityTemplate/FieldBlock';
import { ErrorToast } from '../../ErrorToast';
import { processTemplateUniquePropertiesDetails, processTemplateUniquePropertiesSummaryDetails } from '../../../utils/validation';

const addDetailsFieldsSchema = Yup.object({
    detailsProperties: Yup.array().of(propertiesBaseSchema),
    detailsAttachmentProperties: Yup.array().of(attachmentPropertiesBaseSchema),
}).test('uniqueProperties', processTemplateUniquePropertiesDetails);
const addSummaryDetailsFieldsSchema = Yup.object({
    summaryDetailsProperties: Yup.array().of(propertiesBaseSchema),
    summaryDetailsAttachmentProperties: Yup.array().of(attachmentPropertiesBaseSchema),
}).test('uniqueProperties', processTemplateUniquePropertiesSummaryDetails);

export const useAreThereProcessInstancesByTemplateId = (templateId: string, enabled: boolean) => {
    const { data: areThereInstancesByTemplateIdResponse } = useQuery(
        ['areThereInstancesByTemplateId', templateId],
        () =>
            searchProcessesRequest({ templateIds: [templateId] }),
        {
            enabled,
            initialData: [],
            onError: (error: AxiosError) => {
                // eslint-disable-next-line no-console
                console.log('failed to check areThereInstancesByTemplateId. error:', error);

                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('systemManagement.defaultCantEdit')} />);
            },
        },
    );

    return { areThereAnyInstances: areThereInstancesByTemplateIdResponse!.length > 0 };
}

interface GenericFieldsProperties {
    isEditMode: boolean,
    setBlock: React.Dispatch<React.SetStateAction<boolean>>,
    propertiesType: 'detailsProperties' | 'summaryDetailsProperties',
    attachmentPropertiesType: 'detailsAttachmentProperties' | 'summaryDetailsAttachmentProperties',
    values: ProcessTemplateWizardValues,
    touched: FormikTouched<ProcessTemplateWizardValues>,
    errors: FormikErrors<ProcessTemplateWizardValues>,
    setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => void,
    initialValues: ProcessTemplateWizardValues,
    handleChange: {
        (e: React.ChangeEvent<any>): void;
        <T = string | React.ChangeEvent<any>>(field: T): T extends React.ChangeEvent<any> ? void : (e: string | React.ChangeEvent<any>) => void;
    }
}
const AddGenericFields: React.FC<GenericFieldsProperties> = ({ isEditMode, setBlock, propertiesType, attachmentPropertiesType, values, touched, errors, setFieldValue, initialValues }) => {
    const { areThereAnyInstances } = useAreThereProcessInstancesByTemplateId((values as ProcessTemplateWizardValues & { _id: string })._id, isEditMode);

    return (
        <Grid container direction="column" alignItems="stretch" spacing={1}>
            <Grid item>
                <FieldBlock
                    propertiesType={propertiesType}
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
                    propertiesType={attachmentPropertiesType}
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

export { AddGenericFields, addDetailsFieldsSchema, addSummaryDetailsFieldsSchema };
