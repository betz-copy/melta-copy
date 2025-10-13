import { Autocomplete, FormControl, FormControlLabel, FormHelperText, Grid, TextField } from '@mui/material';
import { FormikErrors, FormikTouched, getIn } from 'formik';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import { RuleWizardValues } from '.';
import { environment } from '../../../globals';
import { MinimizedColorPicker } from '../../inputs/MinimizedColorPicker';
import TextArea from '../../inputs/TextArea';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';

const { errorColor } = environment;

interface CreateRuleEmailNotificationProps {
    mail: RuleWizardValues['mail'];
    touched: FormikTouched<RuleWizardValues>['mail'];
    errors: FormikErrors<RuleWizardValues>['mail'];
    hasUserFields: boolean;
    setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => Promise<void | FormikErrors<RuleWizardValues>>;
}

export const CreateRuleEmailNotification: React.FC<CreateRuleEmailNotificationProps> = ({ mail, touched, errors, hasUserFields, setFieldValue }) => {
    useEffect(() => {
        // set checkboxes to default on change
        if (mail && !hasUserFields) setFieldValue('mail.sendPermissionUsers', true);
        if (mail && hasUserFields) setFieldValue('mail.sendPermissionUsers', false);
    }, [mail?.display, hasUserFields]);

    const mailCheckError = !!touched && (!!getIn(errors, 'sendAssociatedUsers') || !!getIn(errors, 'sendPermissionUsers'));

    return (
        <Grid container direction="column">
            <FormControlLabel
                control={
                    <MeltaCheckbox
                        checked={mail?.display}
                        onChange={(e) => {
                            if (!e.target.checked) {
                                setFieldValue('mail', {
                                    title: '',
                                    body: '',
                                    display: false,
                                    sendAssociatedUsers: false,
                                    sendPermissionUsers: false,
                                });
                            } else {
                                setFieldValue('mail.display', e.target.checked);
                            }
                        }}
                    />
                }
                label={i18next.t('wizard.rule.mailNotification')}
            />

            {!!mail?.display && (
                <Grid container direction="column" gap={2}>
                    <FormHelperText sx={{ color: '#9398C2', fontSize: '14px', margin: 0 }}>
                        {i18next.t('wizard.rule.mailFormatHelper')}
                    </FormHelperText>
                    <TextField
                        name="mailTitle"
                        label={`${i18next.t('wizard.rule.mailTitle')} *`}
                        value={mail?.title}
                        onChange={(event) => setFieldValue('mail.title', event.target.value)}
                        error={touched && Boolean(getIn(errors, 'title'))}
                        helperText={touched && getIn(errors, 'title')}
                        sx={{ width: '100%' }}
                    />
                    <Grid container direction="column">
                        <TextArea
                            id="mailBody"
                            label={`${i18next.t('wizard.rule.mailBody')} *`}
                            value={mail?.body}
                            onChange={(value) => setFieldValue('mail.body', value)}
                            error={touched && Boolean(getIn(errors, 'body'))}
                        />
                        {touched && Boolean(getIn(errors, 'body')) && (
                            <FormHelperText sx={{ color: errorColor, fontSize: '12px', marginLeft: 2 }}>{getIn(errors, 'body')}</FormHelperText>
                        )}
                    </Grid>
                    <Grid container direction="column">
                        <Grid container gap={2}>
                            <FormControl sx={{ fontSize: '14px', margin: 0 }}>{i18next.t('wizard.rule.sendMailTo')}</FormControl>
                            <FormHelperText
                                sx={{
                                    color: mailCheckError ? errorColor : '#9398C2',
                                    fontSize: '14px',
                                    margin: 0,
                                }}
                            >
                                {i18next.t('wizard.rule.sendMailToChooseOne')}
                            </FormHelperText>
                        </Grid>

                        <FormControlLabel
                            control={
                                <MeltaCheckbox
                                    checked={mail.sendPermissionUsers}
                                    onChange={(e) => setFieldValue('mail.sendPermissionUsers', e.target.checked)}
                                />
                            }
                            disabled={!hasUserFields}
                            label={i18next.t('wizard.rule.sendToUsersWithPerms')}
                            sx={{ marginLeft: 0, fontSize: '14px' }}
                        />
                        {hasUserFields && (
                            <FormControlLabel
                                control={
                                    <MeltaCheckbox
                                        checked={mail.sendAssociatedUsers}
                                        onChange={(e) => setFieldValue('mail.sendAssociatedUsers', e.target.checked)}
                                    />
                                }
                                label={`${i18next.t('wizard.rule.sendToAssociatedUsers')} ${i18next.t('wizard.rule.sendToAssociatedUsersHelper')}`}
                                sx={{ marginLeft: 0, fontSize: '14px' }}
                            />
                        )}
                    </Grid>
                </Grid>
            )}
        </Grid>
    );
};

interface CreateRuleColorFieldProps {
    fieldColor: RuleWizardValues['fieldColor'];
    touched: FormikTouched<RuleWizardValues>['fieldColor'];
    errors: FormikErrors<RuleWizardValues>['fieldColor'];
    templateKeys: { key: string; title: string }[];
    setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => Promise<void | FormikErrors<RuleWizardValues>>;
    setFieldTouched: (
        field: string,
        isTouched?: boolean | undefined,
        shouldValidate?: boolean | undefined,
    ) => Promise<void | FormikErrors<RuleWizardValues>>;
}

export const CreateRuleColorField: React.FC<CreateRuleColorFieldProps> = ({
    fieldColor,
    touched,
    errors,
    templateKeys,
    setFieldValue,
    setFieldTouched,
}) => {
    return (
        <Grid container direction="column" gap={2}>
            <FormHelperText sx={{ color: '#9398C2', fontSize: '14px' }}>{i18next.t('wizard.rule.atLeastOne')}</FormHelperText>
            <FormControlLabel
                control={
                    <MeltaCheckbox
                        checked={fieldColor?.display}
                        onChange={(e) => {
                            if (!e.target.checked) {
                                setFieldValue('fieldColor', { display: false, color: '', field: '' });
                            } else {
                                setFieldValue('fieldColor.display', e.target.checked);
                            }
                        }}
                    />
                }
                label={i18next.t('wizard.rule.fieldColor')}
                sx={{ display: 'flex', alignItems: 'center' }}
            />
            {!!fieldColor?.display && (
                <Grid container direction="row" gap={2}>
                    <Autocomplete
                        options={templateKeys}
                        onChange={(_e, value) => setFieldValue('fieldColor.field', value?.key || '')}
                        value={templateKeys.find((option) => option.key === fieldColor?.field) ?? null}
                        getOptionLabel={(option) => option.title}
                        onBlur={() => setFieldTouched('fieldColor.field')}
                        sx={{ width: '250px' }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                error={Boolean(touched && getIn(errors, 'field'))}
                                helperText={touched ? getIn(errors, 'field') : ''}
                                variant="outlined"
                                label={i18next.t('wizard.rule.fieldToColor')}
                            />
                        )}
                    />
                    <MinimizedColorPicker
                        color={fieldColor?.color}
                        onColorChange={(newColor) => setFieldValue('fieldColor.color', newColor)}
                        circleSize="2rem                                                                                                    "
                        error={Boolean(touched && getIn(errors, 'color'))}
                        helperText={touched ? getIn(errors, 'color') : ''}
                    />
                </Grid>
            )}
        </Grid>
    );
};
