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
import { useQuery } from 'react-query';
import { searchEntitiesOfTemplateRequest } from '../../../services/entitiesService';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { ErrorToast } from '../../ErrorToast';
import { useDarkModeStore } from '../../../stores/darkMode';

export const walletTransferSettingsSchema = () => {
    return Yup.object({
        walletTransfer: Yup.object({
            from: Yup.mixed<CommonFormInputProperties>()
                .required(i18next.t('validation.required'))
                .test('different-from-and-to', i18next.t('validation.differentDestinations'), function (fromValue) {
                    const { to } = this.parent as { to?: CommonFormInputProperties };
                    if (!fromValue || !to) return true;
                    return fromValue.name ? fromValue.name !== to.name : fromValue !== to;
                }),
            to: Yup.mixed<CommonFormInputProperties>()
                .required(i18next.t('validation.required'))
                .test('different-from-and-to', i18next.t('validation.differentDestinations'), function (toValue: any) {
                    const { from } = this.parent as { from?: CommonFormInputProperties };
                    if (!toValue || !from) return true;
                    return toValue.name ? toValue.name !== from.name : toValue !== from;
                }),
            description: Yup.string().required(i18next.t('validation.required')),
            amount: Yup.string().required(i18next.t('validation.required')),
        }).test('at-least-one-relationshipReference', i18next.t('validation.eitherFromOrToRelationshipReference'), function (values) {
            if (!values) return true;

            const { from, to } = values as IWalletTransferPopulated;
            if (!from || !to || typeof from === 'string' || typeof to === 'string') return true;

            const isValid = from.type === 'relationshipReference' || to.type === 'relationshipReference';
            if (!isValid) {
                const errorMessage = i18next.t('validation.eitherFromOrToRelationshipReference');

                const errors = [
                    this.createError({ path: `${this.path}.from`, message: errorMessage }),
                    this.createError({ path: `${this.path}.to`, message: errorMessage }),
                ];

                return new Yup.ValidationError(errors);
            }

            return true;
        }),
    });
};

export const WalletTransferSettings: React.FC<
    StepComponentProps<EntityTemplateWizardValues & { _id: string }, 'isEditMode'> & {
        showAccountDisplay: boolean;
        walletTransfer: { value: boolean; set: (val: boolean) => void };
    }
> = ({ values, errors, showAccountDisplay, touched, setFieldValue, walletTransfer, setFieldTouched, isEditMode }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

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

    const { data: areThereInstancesByTemplateIdResponse } = useQuery(
        ['areThereInstancesByTemplateId', values._id],
        () =>
            searchEntitiesOfTemplateRequest(values._id, {
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
    const areThereAnyInstances = isEditMode && areThereInstancesByTemplateIdResponse!.count > 0;

    const source = values.walletTransfer?.from;
    const destination = values.walletTransfer?.to;
    const sourceKeyName = typeof source === 'string' ? source : (source?.name ?? '');
    const destKeyName = typeof destination === 'string' ? destination : (destination?.name ?? '');

    const showSourceInfo = walletTransfer.value && allFields.some((f) => f.name === sourceKeyName && f.type === 'relationshipReference');
    const showDestInfo = walletTransfer.value && allFields.some((f) => f.name === destKeyName && f.type === 'relationshipReference');
    const walletTransferInfo = i18next.t('wizard.entityTemplate.walletTransfer.walletTransferInfo', { returnObjects: true }) as string[];

    return (
        <Grid container direction="column">
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <MeltaCheckbox
                    checked={!!values.walletTransfer || walletTransfer.value}
                    onChange={(e) => {
                        walletTransfer.set(e.target.checked);
                        if (!e.target.checked) {
                            setFieldValue('walletTransfer', null);
                        }
                    }}
                    disabled={showAccountDisplay || areThereAnyInstances}
                />
                <Typography>{i18next.t('wizard.entityTemplate.walletTransfer.transfer')}</Typography>
                <MeltaTooltip
                    title={
                        showAccountDisplay ? (
                            i18next.t('wizard.entityTemplate.walletTransfer.walletCantBeTransfer')
                        ) : areThereAnyInstances ? (
                            i18next.t('wizard.entityTemplate.cannotEditWithInstances')
                        ) : (
                            <>
                                {walletTransferInfo.map((item, index) => (
                                    <div key={index} style={{ marginBottom: '8px' }}>
                                        {item}
                                    </div>
                                ))}
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
            <Grid paddingLeft={3}>
                <Grid container direction="row" spacing={showSourceInfo ? 2.5 : 6} marginBottom={5}>
                    <Grid container direction="row" spacing={1}>
                        <Autocomplete
                            options={incomingFields}
                            onChange={(_e, value) => setFieldValue('walletTransfer.from', value || '')}
                            value={incomingFields.find((option) => option.name === fromKeyName) ?? null}
                            getOptionLabel={(option) => option.title}
                            onBlur={() => setFieldTouched('walletTransfer.from')}
                            sx={{
                                width: 250,
                                ...(!darkMode && {
                                    '& .MuiInputBase-root.Mui-disabled': {
                                        backgroundColor: '#F3F5F9',
                                    },
                                    '& .MuiInputLabel-root.Mui-disabled': {
                                        color: '#BBBED8',
                                    },
                                }),
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    error={Boolean(touched.walletTransfer && getIn(errors.walletTransfer, 'from'))}
                                    helperText={touched.walletTransfer ? getIn(errors.walletTransfer, 'from') : ''}
                                    variant="outlined"
                                    label={i18next.t('wizard.entityTemplate.walletTransfer.source')}
                                />
                            )}
                            disabled={walletTransfer.value === false || areThereAnyInstances}
                        />
                        {showSourceInfo && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <MeltaTooltip title={i18next.t('wizard.entityTemplate.walletTransfer.fromWallet')} variant="bubble">
                                    <InfoOutlined
                                        sx={{
                                            fontSize: 16,
                                            opacity: 0.7,
                                            ml: 1,
                                        }}
                                    />
                                </MeltaTooltip>
                            </Box>
                        )}
                    </Grid>
                    <Grid container direction="row" spacing={1}>
                        <Autocomplete
                            options={outgoingFields}
                            onChange={(_e, value) => setFieldValue('walletTransfer.to', value || '')}
                            value={outgoingFields.find((option) => option.name === toKeyName) ?? null}
                            getOptionLabel={(option) => option.title}
                            onBlur={() => setFieldTouched('walletTransfer.to')}
                            sx={{
                                width: 250,
                                ...(!darkMode && {
                                    '& .MuiInputBase-root.Mui-disabled': {
                                        backgroundColor: '#F3F5F9',
                                    },
                                    '& .MuiInputLabel-root.Mui-disabled': {
                                        color: '#BBBED8',
                                    },
                                }),
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    error={Boolean(touched.walletTransfer && getIn(errors.walletTransfer, 'to'))}
                                    helperText={touched.walletTransfer ? getIn(errors.walletTransfer, 'to') : ''}
                                    variant="outlined"
                                    label={i18next.t('wizard.entityTemplate.walletTransfer.destination')}
                                />
                            )}
                            disabled={!walletTransfer.value || areThereAnyInstances}
                        />
                        {showDestInfo && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <MeltaTooltip title={i18next.t('wizard.entityTemplate.walletTransfer.toWallet')} variant="bubble">
                                    <InfoOutlined
                                        sx={{
                                            fontSize: 16,
                                            opacity: 0.7,
                                            ml: 1,
                                        }}
                                    />
                                </MeltaTooltip>
                            </Box>
                        )}
                    </Grid>
                </Grid>
                <Grid container spacing={6} direction="row" marginBottom={3}>
                    <Grid>
                        <Autocomplete
                            options={allNumFields}
                            onChange={(_e, value) => setFieldValue('walletTransfer.amount', value?.name || '')}
                            value={allNumFields.find((option) => option.name === values.walletTransfer?.amount) ?? null}
                            getOptionLabel={(option) => option.title}
                            onBlur={() => setFieldTouched('walletTransfer.amount')}
                            sx={{
                                width: 250,
                                ...(!darkMode && {
                                    '& .MuiInputBase-root.Mui-disabled': {
                                        backgroundColor: '#F3F5F9',
                                    },
                                    '& .MuiInputLabel-root.Mui-disabled': {
                                        color: '#BBBED8',
                                    },
                                }),
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    error={Boolean(touched.walletTransfer && getIn(errors.walletTransfer, 'amount'))}
                                    helperText={touched.walletTransfer ? getIn(errors.walletTransfer, 'amount') : ''}
                                    variant="outlined"
                                    label={i18next.t('wizard.entityTemplate.walletTransfer.amount')}
                                />
                            )}
                            disabled={!walletTransfer.value || areThereAnyInstances}
                        />
                    </Grid>
                    <Grid>
                        <Autocomplete
                            options={allTextFields}
                            onChange={(_e, value) => setFieldValue('walletTransfer.description', value?.name || '')}
                            value={allTextFields.find((option) => option.name === values.walletTransfer?.description) ?? null}
                            getOptionLabel={(option) => option.title}
                            onBlur={() => setFieldTouched('walletTransfer.description')}
                            sx={{
                                width: 250,
                                ...(!darkMode && {
                                    '& .MuiInputBase-root.Mui-disabled': {
                                        backgroundColor: '#F3F5F9',
                                    },
                                    '& .MuiInputLabel-root.Mui-disabled': {
                                        color: '#BBBED8',
                                    },
                                }),
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    error={Boolean(touched.walletTransfer && getIn(errors.walletTransfer, 'description'))}
                                    helperText={touched.walletTransfer ? getIn(errors.walletTransfer, 'description') : ''}
                                    variant="outlined"
                                    label={i18next.t('wizard.entityTemplate.walletTransfer.description')}
                                />
                            )}
                            disabled={!walletTransfer.value || areThereAnyInstances}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};
