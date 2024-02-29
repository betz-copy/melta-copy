import React from 'react';
import { Grid } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQuery } from 'react-query';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ProcessTemplateWizardValues } from './index';
import { searchProcessesRequest } from '../../../services/processesService';
import { attachmentPropertiesBaseSchema, propertiesBaseSchema } from '../entityTemplate/AddFields';
import FieldBlock from '../entityTemplate/FieldBlock';
import { ErrorToast } from '../../ErrorToast';
import { processTemplateUniquePropertiesDetails } from '../../../utils/validation';
import { StepComponentProps } from '..';

const addDetailsFieldsSchema = Yup.object({
    detailsProperties: Yup.array().of(propertiesBaseSchema),
    detailsAttachmentProperties: Yup.array().of(attachmentPropertiesBaseSchema),
}).test('uniqueProperties', processTemplateUniquePropertiesDetails);

export const useAreThereProcessInstancesByTemplateId = (templateId: string, enabled: boolean) => {
    const { data: areThereInstancesByTemplateIdResponse } = useQuery(
        ['areThereInstancesByTemplateId', templateId],
        () => searchProcessesRequest({ templateIds: [templateId] }),
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
};

export const initialFieldCardDataOnAdd = {
    name: '',
    title: '',
    type: '',
    options: [],
    pattern: '',
    patternCustomErrorMessage: '',
    required: false,
};

const AddDetailsFields: React.FC<StepComponentProps<ProcessTemplateWizardValues, 'isEditMode' | 'setBlock'>> = ({
    isEditMode,
    setBlock,
    values,
    touched,
    errors,
    setFieldValue,
    initialValues,
}) => {
    const { areThereAnyInstances } = useAreThereProcessInstancesByTemplateId(
        (values as ProcessTemplateWizardValues & { _id: string })._id,
        isEditMode,
    );

    return (
        <Grid container direction="column" alignItems="stretch" spacing={1}>
            <Grid item>
                <FieldBlock
                    propertiesType="detailsProperties"
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
                    initialFieldCardDataOnAdd={initialFieldCardDataOnAdd}
                    supportSerialNumberType={false}
                    supportEntityReferenceType
                    supportChangeToRequiredWithInstances={false}
                    supportArrayFields={false}
                />
            </Grid>

            <Grid item>
                <FieldBlock
                    propertiesType="detailsAttachmentProperties"
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
                    initialFieldCardDataOnAdd={initialFieldCardDataOnAdd}
                    supportSerialNumberType={false}
                    supportEntityReferenceType
                    supportChangeToRequiredWithInstances={false}
                    supportArrayFields={false}
                />
            </Grid>
        </Grid>
    );
};

export { AddDetailsFields, addDetailsFieldsSchema };
