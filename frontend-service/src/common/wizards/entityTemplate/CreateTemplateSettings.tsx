import { InfoOutlined } from '@mui/icons-material';
import { Box, Grid, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { EntityTemplateWizardValues, hasAccountBalanceField } from '.';
import { searchEntitiesOfTemplateRequest } from '../../../services/entitiesService';
import { variableNameValidation } from '../../../utils/validation';
import { ErrorToast } from '../../ErrorToast';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { StepComponentProps } from '../index';
import { ChooseCategory } from './ChooseCategory';
import { PropertyItem } from './commonInterfaces';
import { CreateTemplateName } from './CreateTemplateName';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { omit } from 'lodash';

export const useCreateOrEditTemplateNameSchema = (templates: IEntityTemplateMap, currentTemplateId?: string) => {
    const otherTemplates = Array.from(templates.values()).filter((template) => template._id !== currentTemplateId);

    const existingTemplateNames = otherTemplates.map((template) => template.name);
    const existingTemplateDisplayNames = otherTemplates.map((template) => template.displayName);

    return Yup.object({
        name: Yup.string()
            .matches(variableNameValidation, i18next.t('validation.variableName'))
            .required(i18next.t('validation.required'))
            .test('unique-name', i18next.t('validation.existingName'), (value) => {
                return !existingTemplateNames.includes(value || '');
            }),
        displayName: Yup.string()
            .required(i18next.t('validation.required'))
            .test('unique-displayName', i18next.t('validation.existingDisplayName'), (value) => {
                return !existingTemplateDisplayNames.includes(value || '');
            }),
    });
};

const CreateTemplateSettings: React.FC<
    StepComponentProps<EntityTemplateWizardValues, 'isEditMode'> & {
        exportFormats: { value: boolean; set: (val: boolean) => void };
        showAccountDisplay: { value: boolean; set: (val: boolean) => void };
    }
> = (props) => {
    const { values, exportFormats, showAccountDisplay, isEditMode, setFieldValue } = props;

    const { data: areThereInstancesByTemplateIdResponse } = useQuery(
        ['areThereInstancesByTemplateId', values._id],
        () =>
            searchEntitiesOfTemplateRequest(values._id ?? '', {
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

    const isWalletTemplate = hasAccountBalanceField(Object.values(values.properties) as PropertyItem[]);
    const areThereAnyInstances =
        isEditMode && areThereInstancesByTemplateIdResponse && areThereInstancesByTemplateIdResponse.count > 0 && isWalletTemplate;
    const walletInfo = i18next.t('wizard.entityTemplate.wallet.walletInfo', { returnObjects: true }) as string[];

    return (
        <Grid container direction="column" spacing={4}>
            <Grid container direction="row">
                <ChooseCategory {...props} />
            </Grid>
            <CreateTemplateName {...props} gridProps={{ direction: 'row' }} />
            <Grid container direction="column" alignItems="flex-start" spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center' }} marginBottom={1}>
                    <MeltaCheckbox
                        checked={showAccountDisplay.value}
                        onChange={(e) => {
                            const isChecked = e.target.checked;
                            showAccountDisplay.set(isChecked);

                            if (!isChecked) {
                                setFieldValue(
                                    'properties',
                                    values.properties.map((property) => {
                                        if (property.type === 'field' && property.data?.accountBalance)
                                            return {
                                                ...property,
                                                data: omit(property.data, ['accountBalance', 'readOnly']),
                                            };

                                        if (property.type === 'group') {
                                            return {
                                                ...property,
                                                fields: property.fields.map((field) => {
                                                    if (field.accountBalance) return omit(field, ['accountBalance', 'readOnly']);

                                                    return field;
                                                }),
                                            };
                                        }

                                        return property;
                                    }),
                                );
                            }
                        }}
                        disabled={areThereAnyInstances || !!values.walletTransfer}
                    />
                    <Typography>{i18next.t('wizard.entityTemplate.wallet.walletDisplay')}</Typography>
                    <MeltaTooltip
                        title={
                            values.walletTransfer ? (
                                i18next.t('wizard.entityTemplate.wallet.transferCantBeWallet')
                            ) : areThereAnyInstances ? (
                                i18next.t('wizard.entityTemplate.cannotEditWithInstances')
                            ) : (
                                <>
                                    <div>{i18next.t('wizard.entityTemplate.wallet.asWallet')}</div>
                                    <ul>
                                        {walletInfo.map((item, index) => (
                                            <li key={`${index}-${item}`}>{item}</li>
                                        ))}
                                    </ul>
                                </>
                            )
                        }
                        variant="bubble"
                    >
                        <InfoOutlined
                            sx={{
                                fontSize: 16,
                                opacity: 0.7,
                                ml: 1,
                            }}
                        />
                    </MeltaTooltip>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MeltaCheckbox
                        checked={exportFormats.value}
                        onChange={(e) => {
                            exportFormats.set(e.target.checked);
                        }}
                    />
                    <Typography>{i18next.t('wizard.entityTemplate.exportDocumentsSelect')}</Typography>
                    <MeltaTooltip title={i18next.t('wizard.entityTemplate.exportDocuments')} variant="bubble">
                        <InfoOutlined
                            sx={{
                                fontSize: 16,
                                opacity: 0.7,
                                ml: 1,
                            }}
                        />
                    </MeltaTooltip>
                </Box>
            </Grid>
        </Grid>
    );
};

export { CreateTemplateSettings };
