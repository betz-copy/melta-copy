import { InfoOutlined } from '@mui/icons-material';
import { Box, Grid, Typography } from '@mui/material';
import { PropertyFormat } from '@packages/entity-template';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { searchEntitiesOfTemplateRequest } from '../../../services/entitiesService';
import { useDarkModeStore } from '../../../stores/darkMode';
import { ErrorToast } from '../../ErrorToast';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import MeltaTooltip, { TooltipVariant } from '../../MeltaDesigns/MeltaTooltip';
import { StepComponentProps } from '../index';
import { EntityTemplateWizardValues } from '.';
import { CommonFormInputProperties, IWalletTransferPopulated } from './commonInterfaces';
import { WalletTransferAutocomplete } from './WalletTransferAutoComplete';

function validateDifferent(this: Yup.TestContext, value: CommonFormInputProperties | undefined, otherKey: 'from' | 'to') {
    const otherValue = this.parent[otherKey];

    if (!value || !otherValue) return true;

    const getName = (v) => (v?.name ? v.name : v);

    return getName(value) !== getName(otherValue);
}

export const walletTransferSettingsSchema = () => {
    return Yup.object({
        walletTransfer: Yup.object({
            from: Yup.mixed<CommonFormInputProperties>()
                .required(i18next.t('validation.required'))
                .test('different-from-and-to', i18next.t('validation.differentDestinations'), function (value) {
                    return validateDifferent.call(this, value, 'to');
                }),
            to: Yup.mixed<CommonFormInputProperties>()
                .required(i18next.t('validation.required'))
                .test('different-from-and-to', i18next.t('validation.differentDestinations'), function (value) {
                    return validateDifferent.call(this, value, 'from');
                }),
            description: Yup.string().required(i18next.t('validation.required')),
            amount: Yup.string().required(i18next.t('validation.required')),
        })
            .test('at-least-one-relationshipReference', i18next.t('validation.eitherFromOrToRelationshipReference'), function (values) {
                if (!values) return true;

                const { from, to } = values as IWalletTransferPopulated;

                if (!from || !to || typeof from === 'string' || typeof to === 'string') return true;

                const isValid = from.type === PropertyFormat.relationshipReference || to.type === PropertyFormat.relationshipReference;
                if (!isValid) {
                    const errorMessage = i18next.t('validation.eitherFromOrToRelationshipReference');

                    const errors = [
                        this.createError({ path: `${this.path}.from`, message: errorMessage }),
                        this.createError({ path: `${this.path}.to`, message: errorMessage }),
                    ];

                    return new Yup.ValidationError(errors);
                }

                return true;
            })
            .nullable(),
    });
};

export const WalletTransferSettings: React.FC<
    StepComponentProps<EntityTemplateWizardValues & { _id: string }, 'isEditMode'> & {
        isAccountTemplate: boolean;
    }
> = ({ values, errors, isAccountTemplate, touched, setFieldValue, isEditMode }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const { data: areThereInstancesByTemplateIdResponse } = useQuery(
        ['areThereInstancesByTemplateId', values._id],
        () =>
            searchEntitiesOfTemplateRequest(values._id!, {
                skip: 0,
                limit: 1,
                showRelationships: false,
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

    const allFields = values.properties.flatMap((property) => {
        if (property.type === 'field') {
            return [property.data];
        }
        if (property.type === 'group') {
            return property.fields;
        }
        return [];
    });

    const getFieldsByDirection = (direction) =>
        allFields.filter(
            (field) =>
                field.required &&
                (field.type === 'enum' ||
                    field.type === 'string' ||
                    (field.type === 'relationshipReference' && field.relationshipReference?.relationshipTemplateDirection === direction)),
        );

    const outgoingFields = getFieldsByDirection('outgoing');
    const incomingFields = getFieldsByDirection('incoming');

    const allTextFields = allFields.filter(({ type }) => type === 'string');
    const allNumFields = allFields.filter(({ type, required }) => type === 'number' && required);

    const from = values.walletTransfer?.from;
    const to = values.walletTransfer?.to;
    const fromKeyName = typeof from === 'string' ? from : from?.name;
    const toKeyName = typeof to === 'string' ? to : to?.name;

    const areThereAnyInstances = isEditMode && areThereInstancesByTemplateIdResponse && areThereInstancesByTemplateIdResponse.count > 0;

    const source = values.walletTransfer?.from;
    const destination = values.walletTransfer?.to;
    const sourceKeyName = typeof source === 'string' ? source : (source?.name ?? '');
    const destKeyName = typeof destination === 'string' ? destination : (destination?.name ?? '');

    const showSourceInfo = !!values.walletTransfer && allFields.some((f) => f.name === sourceKeyName && f.type === 'relationshipReference');
    const showDestInfo = !!values.walletTransfer && allFields.some((f) => f.name === destKeyName && f.type === 'relationshipReference');
    const walletTransferInfo = i18next.t('wizard.entityTemplate.walletTransfer.walletTransferInfo', { returnObjects: true }) as string[];

    // biome-ignore lint/correctness/useExhaustiveDependencies: re-render
    useEffect(() => {
        if (!values.walletTransfer) setFieldValue('walletTransfer', null);
    }, []);

    return (
        <Grid container direction="column">
            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <MeltaCheckbox
                    checked={!!values.walletTransfer}
                    onChange={(e) => {
                        setFieldValue('walletTransfer', { from: '', to: '', amount: '', description: '' });
                        if (!e.target.checked) {
                            setFieldValue('walletTransfer', null);
                        }
                    }}
                    disabled={isAccountTemplate || areThereAnyInstances}
                />
                <Typography>{i18next.t('wizard.entityTemplate.walletTransfer.transfer')}</Typography>
                <MeltaTooltip
                    title={
                        isAccountTemplate ? (
                            i18next.t('wizard.entityTemplate.walletTransfer.walletCantBeTransfer')
                        ) : areThereAnyInstances ? (
                            i18next.t('wizard.entityTemplate.cannotEditWithInstances')
                        ) : (
                            <div>
                                {walletTransferInfo.map((item) => (
                                    <div key={item} style={{ marginBottom: '8px' }}>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        )
                    }
                    variant={TooltipVariant.Bubble}
                >
                    <InfoOutlined
                        sx={{
                            fontSize: 16,
                            opacity: 0.7,
                            ml: 1,
                            color: '#9398C2',
                        }}
                    />
                </MeltaTooltip>
            </Box>
            <Grid paddingLeft={3}>
                <Grid container direction="row" spacing={showSourceInfo ? 2.5 : 6} marginBottom={5}>
                    <Grid container direction="row" spacing={1}>
                        <WalletTransferAutocomplete
                            label={i18next.t('wizard.entityTemplate.walletTransfer.source')}
                            options={incomingFields}
                            value={incomingFields.find((o) => o.name === fromKeyName) ?? null}
                            onChange={(v) => setFieldValue('walletTransfer.from', v || '')}
                            fieldPath="walletTransfer.from"
                            touched={touched}
                            errors={errors}
                            disabled={!values.walletTransfer || areThereAnyInstances}
                            darkMode={darkMode}
                            infoTooltip={showSourceInfo ? i18next.t('wizard.entityTemplate.walletTransfer.fromWallet') : undefined}
                        />
                    </Grid>
                    <Grid container direction="row" spacing={1}>
                        <WalletTransferAutocomplete
                            label={i18next.t('wizard.entityTemplate.walletTransfer.destination')}
                            options={outgoingFields}
                            value={outgoingFields.find((o) => o.name === toKeyName) ?? null}
                            onChange={(v) => setFieldValue('walletTransfer.to', v || '')}
                            fieldPath="walletTransfer.to"
                            touched={touched}
                            errors={errors}
                            disabled={!values.walletTransfer || areThereAnyInstances}
                            darkMode={darkMode}
                            infoTooltip={showDestInfo ? i18next.t('wizard.entityTemplate.walletTransfer.toWallet') : undefined}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={6} direction="row" marginBottom={3}>
                    <Grid>
                        <WalletTransferAutocomplete
                            label={i18next.t('wizard.entityTemplate.walletTransfer.amount')}
                            options={allNumFields}
                            value={allNumFields.find((o) => o.name === values.walletTransfer?.amount) ?? null}
                            onChange={(v) => setFieldValue('walletTransfer.amount', v?.name || '')}
                            fieldPath="walletTransfer.amount"
                            touched={touched}
                            errors={errors}
                            disabled={!values.walletTransfer || areThereAnyInstances}
                            darkMode={darkMode}
                        />
                    </Grid>
                    <Grid>
                        <WalletTransferAutocomplete
                            label={i18next.t('wizard.entityTemplate.walletTransfer.description')}
                            options={allTextFields}
                            value={allTextFields.find((o) => o.name === values.walletTransfer?.description) ?? null}
                            onChange={(v) => setFieldValue('walletTransfer.description', v?.name || '')}
                            fieldPath="walletTransfer.description"
                            touched={touched}
                            errors={errors}
                            disabled={!values.walletTransfer || areThereAnyInstances}
                            darkMode={darkMode}
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};
