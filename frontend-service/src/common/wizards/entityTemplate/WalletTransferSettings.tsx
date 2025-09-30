import { InfoOutlined } from '@mui/icons-material';
import { Autocomplete, Box, Grid, TextField, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import * as Yup from 'yup';
import { EntityTemplateWizardValues } from '.';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { StepComponentProps } from '../index';
import { getIn } from 'formik';
import { CommonFormInputProperties } from './commonInterfaces';
import { IWalletTransferPopulated } from '../../../interfaces/entityTemplates';

export const walletTransferSettingsSchema = () => {
    return Yup.object({
        walletTransfer: Yup.object({
            from: Yup.mixed<CommonFormInputProperties>()
                .required(i18next.t('validation.required'))
                .test('different-from-and-to', i18next.t('validation.differentDestinations'), function (fromValue) {
                    const { to } = this.parent as { to?: CommonFormInputProperties };
                    if (!fromValue || !to) return true;
                    return fromValue.name !== to.name;
                }),

            to: Yup.mixed<CommonFormInputProperties>()
                .required(i18next.t('validation.required'))
                .test('different-from-and-to', i18next.t('validation.differentDestinations'), function (toValue: any) {
                    const { from } = this.parent as { from?: CommonFormInputProperties };
                    if (!toValue || !from) return true;
                    return toValue.name !== from.name;
                }),

            description: Yup.string().required(i18next.t('validation.required')),

            amount: Yup.string().required(i18next.t('validation.required')),
        }).test('at-least-one-relationshipReference', 'Either From or To must be relationshipReference', (values) => {
            if (!values) return false;

            const { from, to } = values as IWalletTransferPopulated;
            return from.type === 'relationshipReference' || to.type === 'relationshipReference';
        }),
    });
};

export const WalletTransferSettings: React.FC<
    StepComponentProps<EntityTemplateWizardValues> & {
        showAccountDisplay: boolean;
        walletTransfer: { value: boolean; set: (val: boolean) => void };
    }
> = ({ values, errors, showAccountDisplay, touched, setFieldValue, walletTransfer, setFieldTouched }) => {
    const allFields = values.properties.flatMap((property) => {
        if (property.type === 'field') {
            return [property.data];
        }
        if (property.type === 'group') {
            return property.fields;
        }
        return [];
    });

    const filterFieldsByDirection = (direction) =>
        allFields.filter(
            (field) =>
                field.required &&
                (field.type === 'enum' ||
                    field.type === 'string' ||
                    (field.type === 'relationshipReference' && field.relationshipReference?.relationshipTemplateDirection === direction)),
        );

    const outgoingFields = filterFieldsByDirection('outgoing');
    const incomingFields = filterFieldsByDirection('incoming');

    const allTextFields = allFields.filter(({ type }) => type === 'string');
    const allNumFields = allFields.filter(({ type, required }) => type === 'number' && required);

    const from = values.walletTransfer?.from;
    const to = values.walletTransfer?.to;
    const fromKeyName = typeof from === 'string' ? from : from?.name;
    const toKeyName = typeof to === 'string' ? to : to?.name;

    return (
        <Grid container direction="column">
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <MeltaCheckbox
                    checked={walletTransfer.value}
                    onChange={(e) => {
                        walletTransfer.set(e.target.checked);
                    }}
                    disabled={showAccountDisplay}
                />
                <Typography>{i18next.t('wizard.entityTemplate.walletTransfer.transfer')}</Typography>
                <MeltaTooltip title={showAccountDisplay ? 'לא ניתן כי נבחר כתצוגת ארנק' : 'תבנית יישות העברה '}>
                    <InfoOutlined
                        sx={{
                            fontSize: 16,
                            opacity: 0.7,
                            cursor: 'help',
                            ml: 1,
                        }}
                    />
                </MeltaTooltip>
            </Box>
            <Grid paddingLeft={3}>
                <Grid container direction="row" spacing={3} marginBottom={5}>
                    <Grid container direction="row">
                        <Autocomplete
                            options={incomingFields}
                            onChange={(_e, value) => setFieldValue('walletTransfer.from', value || '')}
                            value={incomingFields.find((option) => option.name === fromKeyName) ?? null}
                            getOptionLabel={(option) => option.title}
                            onBlur={() => setFieldTouched('walletTransfer.from')}
                            sx={{ width: '250px' }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    error={Boolean(touched.walletTransfer && getIn(errors.walletTransfer, 'from'))}
                                    helperText={touched.walletTransfer ? getIn(errors.walletTransfer, 'from') : ''}
                                    variant="outlined"
                                    label={i18next.t('wizard.entityTemplate.walletTransfer.source')}
                                />
                            )}
                            disabled={walletTransfer.value === false}
                        />
                        {walletTransfer.value && values.walletTransfer?.to?.type === 'relationshipReference' && (
                            <MeltaTooltip title="ערך ההעברה ירד מהיתרה של יישות הארנק המקושרת">
                                <InfoOutlined
                                    sx={{
                                        fontSize: 16,
                                        opacity: 0.7,
                                        cursor: 'help',
                                        ml: 1,
                                    }}
                                />
                            </MeltaTooltip>
                        )}
                    </Grid>
                    <Grid container direction="row">
                        <Autocomplete
                            options={outgoingFields}
                            onChange={(_e, value) => setFieldValue('walletTransfer.to', value || '')}
                            value={outgoingFields.find((option) => option.name === toKeyName) ?? null}
                            getOptionLabel={(option) => option.title}
                            onBlur={() => setFieldTouched('walletTransfer.to')}
                            sx={{ width: '250px' }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    error={Boolean(touched.walletTransfer && getIn(errors.walletTransfer, 'to'))}
                                    helperText={touched.walletTransfer ? getIn(errors.walletTransfer, 'to') : ''}
                                    variant="outlined"
                                    label={i18next.t('wizard.entityTemplate.walletTransfer.destination')}
                                />
                            )}
                            disabled={!walletTransfer.value}
                        />
                        {walletTransfer.value && values.walletTransfer?.from?.type === 'relationshipReference' && (
                            <MeltaTooltip title="ערך ההעברה יתווסף ליתרה של יישות הארנק המקושרת">
                                <InfoOutlined
                                    sx={{
                                        fontSize: 16,
                                        opacity: 0.7,
                                        cursor: 'help',
                                        ml: 1,
                                    }}
                                />
                            </MeltaTooltip>
                        )}
                    </Grid>
                </Grid>
                <Grid container spacing={3} direction="row" marginBottom={3}>
                    <Grid>
                        <Autocomplete
                            options={allNumFields}
                            onChange={(_e, value) => setFieldValue('walletTransfer.amount', value?.name || '')}
                            value={allNumFields.find((option) => option.name === values.walletTransfer?.amount) ?? null}
                            getOptionLabel={(option) => option.title}
                            onBlur={() => setFieldTouched('walletTransfer.amount')}
                            sx={{ width: '250px' }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    error={Boolean(touched.walletTransfer && getIn(errors.walletTransfer, 'amount'))}
                                    helperText={touched.walletTransfer ? getIn(errors.walletTransfer, 'amount') : ''}
                                    variant="outlined"
                                    label={i18next.t('wizard.entityTemplate.walletTransfer.amount')}
                                />
                            )}
                            disabled={!walletTransfer.value}
                        />
                    </Grid>
                    <Grid>
                        <Autocomplete
                            options={allTextFields}
                            onChange={(_e, value) => setFieldValue('walletTransfer.description', value?.name || '')}
                            value={allTextFields.find((option) => option.name === values.walletTransfer?.description) ?? null}
                            getOptionLabel={(option) => option.title}
                            onBlur={() => setFieldTouched('walletTransfer.description')}
                            sx={{ width: '250px' }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    error={Boolean(touched.walletTransfer && getIn(errors.walletTransfer, 'description'))}
                                    helperText={touched.walletTransfer ? getIn(errors.walletTransfer, 'description') : ''}
                                    variant="outlined"
                                    label={i18next.t('wizard.entityTemplate.walletTransfer.description')}
                                />
                            )}
                            disabled={!walletTransfer.value}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};
