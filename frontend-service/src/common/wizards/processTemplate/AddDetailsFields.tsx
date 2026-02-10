import { Grid } from '@mui/material';
import { PropertyType } from '@packages/entity-template';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { searchProcessesRequest } from '../../../services/processesService';
import { processTemplateUniquePropertiesDetails } from '../../../utils/validation';
import { ErrorToast } from '../../ErrorToast';
import { StepComponentProps } from '..';
import { attachmentPropertiesBaseSchema, propertiesBaseSchema } from '../entityTemplate/AddFields';
import { FieldBlock } from '../entityTemplate/fieldBlock/FieldBlock';
import { ProcessTemplateWizardValues } from './index';

export const fieldDetailsSchema = Yup.object({
    type: Yup.string().oneOf(['field']).required(),
    data: propertiesBaseSchema.required(),
});

const addDetailsFieldsSchema = Yup.object({
    detailsProperties: Yup.array()
        .of(fieldDetailsSchema)
        .min(1, i18next.t('validation.oneField'))
        .test(i18next.t('validation.oneField'), i18next.t('validation.oneField'), (value) =>
            value ? value.some((obj) => !('deleted' in obj) || obj.deleted === false) : false,
        )
        .test(i18next.t('validation.oneField'), i18next.t('validation.oneField'), (value) =>
            value ? value.some((obj) => !('archive' in obj) || obj.archive === false || obj.archive === undefined) : false,
        ),
    detailsAttachmentProperties: Yup.array().of(
        Yup.object({
            type: Yup.string().oneOf(['field']).required(),
            data: attachmentPropertiesBaseSchema.shape({
                required: Yup.boolean().required(i18next.t('validation.required')),
            }),
        }),
    ),
}).test('uniqueProperties', processTemplateUniquePropertiesDetails);

export const useAreThereProcessInstancesByTemplateId = (templateId: string, enabled: boolean) => {
    const { data: areThereInstancesByTemplateIdResponse } = useQuery(
        ['areThereInstancesByTemplateId', templateId],
        () => searchProcessesRequest({ templateIds: [templateId], limit: 1, skip: 0 }),
        {
            enabled,
            initialData: [],
            onError: (error: AxiosError) => {
                console.error('failed to check areThereInstancesByTemplateId. error:', error);
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('systemManagement.defaultCantEdit')} />);
            },
        },
    );

    return { areThereAnyInstances: areThereInstancesByTemplateIdResponse!.length > 0 };
};

export const initialFieldCardDataOnAdd = {
    name: '',
    title: '',
    type: PropertyType.string,
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
            <Grid>
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
                    supportDeleteForExistingInstances
                    supportRelationshipReference={false}
                    supportUserType={false}
                    supportConvertingToMultipleFields={false}
                    locationSearchFields={{ show: false, disabled: false }}
                />
            </Grid>

            <Grid>
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
                    supportEntityReferenceType={false}
                    supportChangeToRequiredWithInstances={false}
                    supportArrayFields={false}
                    supportDeleteForExistingInstances
                    supportRelationshipReference={false}
                    supportUserType={false}
                    supportConvertingToMultipleFields={false}
                    locationSearchFields={{ show: false, disabled: false }}
                />
            </Grid>
        </Grid>
    );
};

export { AddDetailsFields, addDetailsFieldsSchema };
