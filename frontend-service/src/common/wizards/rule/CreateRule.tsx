import { Autocomplete, Divider, FormControl, FormControlLabel, FormHelperText, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { getIn } from 'formik';
import i18next from 'i18next';
import { omit } from 'lodash';
import React from 'react';
import { useQueryClient } from 'react-query';
import * as Yup from 'yup';
import { RuleWizardValues } from '.';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { ActionOnFail } from '../../../interfaces/rules';
import { useUserStore } from '../../../stores/user';
import { getAllWritePermissionEntityTemplates } from '../../../utils/permissions/templatePermissions';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { MinimizedColorPicker } from '../../inputs/MinimizedColorPicker';
import TextArea from '../../inputs/TextArea';
import { StepComponentProps } from '../index';

const mailSchema = Yup.object({
    display: Yup.boolean(),
    title: Yup.string().when('display', {
        is: true,
        then: (schema) => schema.required(i18next.t('validation.required')),
    }),
    body: Yup.string().when('display', {
        is: true,
        then: (schema) => schema.required(i18next.t('validation.required')),
    }),
    sendPermissionUsers: Yup.boolean().when('display', {
        is: true,
        then: (schema) =>
            schema.when('sendAssociatedUsers', {
                is: true,
                then: (subSchema) => subSchema,
                otherwise: (subSchema) => subSchema.required(i18next.t('validation.required')).oneOf([true]),
            }),
    }),
    sendAssociatedUsers: Yup.boolean().when('display', {
        is: true,
        then: (schema) =>
            schema.when('sendPermissionUsers', {
                is: true,
                then: (subSchema) => subSchema,
                otherwise: (subSchema) => subSchema.required(i18next.t('validation.required')).oneOf([true]),
            }),
    }),
});

const fieldColorSchema = Yup.object({
    display: Yup.boolean(),
    field: Yup.string().when('display', {
        is: true,
        then: (schema) => schema.required(i18next.t('validation.required')),
    }),
    color: Yup.string().when('display', {
        is: true,
        then: (schema) => schema.required(i18next.t('validation.required')),
    }),
});

const createRuleSchema = Yup.object({
    name: Yup.string().required(i18next.t('validation.required')),
    description: Yup.string().required(i18next.t('validation.required')),
    actionOnFail: Yup.string()
        .oneOf([ActionOnFail.WARNING, ActionOnFail.ENFORCEMENT, ActionOnFail.INDICATOR])
        .required(i18next.t('validation.required')),
    entityTemplateId: Yup.string().required(i18next.t('validation.required')),
    fieldColor: fieldColorSchema.nullable().when('actionOnFail', {
        is: ActionOnFail.INDICATOR,
        otherwise: (schema) => schema.strip().nullable(),
    }),
    mail: mailSchema.nullable().when('actionOnFail', {
        is: ActionOnFail.INDICATOR,
        otherwise: (schema) => schema.strip().nullable(),
    }),
}).test('at-least-one-indicator-config', i18next.t('wizard.rule.mustSelectOneIndicatorConfig'), (values) => {
    if (values.actionOnFail !== ActionOnFail.INDICATOR) return true;

    return values.fieldColor?.display === true || values.mail?.display === true;
});

const CreateRule: React.FC<StepComponentProps<RuleWizardValues, 'isEditMode'>> = ({
    values,
    touched,
    errors,
    handleChange,
    setFieldValue,
    setFieldTouched,
    isEditMode,
    setValues,
}) => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const { entityTemplateId } = values;

    const activeEntityTemplatesFiltered = Array.from(entityTemplates.values()).filter(({ disabled }) => !disabled);
    const allowedEntityTemplates = getAllWritePermissionEntityTemplates(activeEntityTemplatesFiltered, currentUser);

    const entityTemplate = entityTemplateId ? entityTemplates.get(entityTemplateId)! : null;
    const templateKeys = Object.entries(entityTemplate?.properties.properties || {})
        .filter(([_key, { format }]) => format !== 'comment')
        .map(([key, { title }]) => ({ key, title }));

    const onRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value !== ActionOnFail.INDICATOR && !!values.fieldColor) {
            setValues((prevValues: RuleWizardValues) => omit(prevValues, 'fieldColor'));
            setValues((prevValues: RuleWizardValues) => omit(prevValues, 'mail'));
        }

        if (event.target.value === ActionOnFail.INDICATOR) setFieldValue('fieldColor.display', true); //TODO: remove after adding mail - Uri
        handleChange(event);
    };

    const oneOrMoreMailChecks = !!touched.mail && (!!getIn(errors.mail, 'sendAssociatedUsers') || !!getIn(errors.mail, 'sendPermissionUsers'));

    return (
        <Grid container direction="column" spacing={1}>
            <Grid container direction="row" gap={1}>
                <TextField
                    name="name"
                    label={i18next.t('wizard.rule.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    sx={{ width: '250px' }}
                />

                <TextField
                    name="description"
                    label={i18next.t('wizard.rule.description')}
                    value={values.description}
                    onChange={handleChange}
                    error={touched.description && Boolean(errors.description)}
                    helperText={touched.description && errors.description}
                    multiline
                    sx={{ width: '250px' }}
                />

                <Autocomplete
                    options={allowedEntityTemplates}
                    onChange={(_e, value) => setFieldValue('entityTemplateId', value?._id || '')}
                    value={entityTemplate}
                    getOptionLabel={(option) => option.displayName}
                    onBlur={() => setFieldTouched('entityTemplateId')}
                    sx={{ width: '250px' }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            error={Boolean(touched.entityTemplateId && errors.entityTemplateId)}
                            helperText={touched.entityTemplateId ? errors.entityTemplateId : ''}
                            variant="outlined"
                            label={i18next.t('wizard.rule.primaryEntityTemplate')}
                        />
                    )}
                    disabled={isEditMode}
                />
            </Grid>
            <Grid>
                <FormControl disabled={isEditMode} sx={{ width: '100%' }}>
                    <RadioGroup row name="actionOnFail" onChange={onRadioChange} value={values.actionOnFail}>
                        {[ActionOnFail.WARNING, ActionOnFail.ENFORCEMENT, ActionOnFail.INDICATOR].map((actionOnFail) => (
                            <FormControlLabel
                                value={actionOnFail}
                                control={<Radio />}
                                label={i18next.t(`wizard.rule.actions.${actionOnFail.toLowerCase()}`)}
                            />
                        ))}
                    </RadioGroup>
                    <FormHelperText>{touched.actionOnFail && errors.actionOnFail}</FormHelperText>
                </FormControl>

                {values.actionOnFail === ActionOnFail.INDICATOR && (
                    <Grid container direction="column" gap={2}>
                        <FormHelperText sx={{ color: '#9398C2', fontSize: '14px' }}>{i18next.t('wizard.rule.atLeastOne')}</FormHelperText>
                        <FormControlLabel
                            control={
                                <MeltaCheckbox
                                    checked={values.fieldColor?.display}
                                    onChange={(e) => setFieldValue('fieldColor.display', e.target.checked)}
                                    disabled //TODO: remove after adding mail - Uri
                                />
                            }
                            label={i18next.t('wizard.rule.fieldColor')}
                            sx={{ display: 'flex', alignItems: 'center' }}
                        />
                        {!!values.fieldColor?.display && (
                            <Grid container direction="row" gap={2}>
                                <Autocomplete
                                    options={templateKeys}
                                    onChange={(_e, value) => setFieldValue('fieldColor.field', value?.key || '')}
                                    value={templateKeys.find((option) => option.key === values.fieldColor?.field) ?? null}
                                    getOptionLabel={(option) => option.title}
                                    onBlur={() => setFieldTouched('fieldColor.field')}
                                    sx={{ width: '250px' }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            error={Boolean(touched.fieldColor && getIn(errors.fieldColor, 'field'))}
                                            helperText={touched.fieldColor ? getIn(errors.fieldColor, 'field') : ''}
                                            variant="outlined"
                                            label={i18next.t('wizard.rule.fieldToColor')}
                                        />
                                    )}
                                />
                                <MinimizedColorPicker
                                    color={values.fieldColor?.color}
                                    onColorChange={(newColor) => setFieldValue('fieldColor.color', newColor)}
                                    circleSize="2rem                                                                                                    "
                                    error={Boolean(touched.fieldColor && getIn(errors.fieldColor, 'color'))}
                                    helperText={touched.fieldColor ? getIn(errors.fieldColor, 'color') : ''}
                                />
                            </Grid>
                        )}
                        <Grid>
                            <Divider sx={{ color: '#CCCFE580' }} />
                        </Grid>

                        <Grid container direction="column">
                            <FormControlLabel
                                control={
                                    <MeltaCheckbox checked={values.mail?.display} onChange={(e) => setFieldValue('mail.display', e.target.checked)} />
                                }
                                label={i18next.t('wizard.rule.mailNotification')}
                            />

                            {!!values.mail?.display && (
                                <Grid container direction="column" gap={2}>
                                    <FormHelperText sx={{ color: '#9398C2', fontSize: '14px', margin: 0 }}>
                                        {i18next.t('wizard.rule.mailFormatHelper')}
                                    </FormHelperText>
                                    <TextField
                                        name="mailTitle"
                                        label={`${i18next.t('wizard.rule.mailTitle')} *`}
                                        value={values.mail?.title}
                                        onChange={(event) => setFieldValue('mail.title', event.target.value)}
                                        error={touched.mail && Boolean(getIn(errors.mail, 'title'))}
                                        helperText={touched.mail && getIn(errors.mail, 'title')}
                                        sx={{ width: '100%' }}
                                    />
                                    <TextArea
                                        id="mailBody"
                                        label={`${i18next.t('wizard.rule.mailBody')} *`}
                                        value={values.mail?.body}
                                        onChange={(value) => setFieldValue('mail.body', value)}
                                        error={touched.mail && Boolean(getIn(errors.mail, 'body'))}
                                    />
                                    <Grid container direction="column">
                                        <Grid container gap={2}>
                                            <FormControl sx={{ fontSize: '14px', margin: 0 }}>{i18next.t('wizard.rule.sendMailTo')}</FormControl>
                                            <FormHelperText
                                                sx={{
                                                    color: oneOrMoreMailChecks ? '#FF0000' : '#9398C2',
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
                                                    checked={values.mail.sendPermissionUsers}
                                                    onChange={(e) => setFieldValue('mail.sendPermissionUsers', e.target.checked)}
                                                />
                                            }
                                            label={i18next.t('wizard.rule.sendToUsersWithPerms')}
                                            sx={{ marginLeft: 0, color: oneOrMoreMailChecks ? '#ff0000' : 'auto', fontSize: '14px' }}
                                        />
                                        <FormControlLabel
                                            control={
                                                <MeltaCheckbox
                                                    checked={values.mail.sendAssociatedUsers}
                                                    onChange={(e) => setFieldValue('mail.sendAssociatedUsers', e.target.checked)}
                                                />
                                            }
                                            label={`${i18next.t('wizard.rule.sendToAssociatedUsers')} (שדה מסוג משתמש)`}
                                            sx={{ marginLeft: 0, color: oneOrMoreMailChecks ? '#ff0000' : 'auto', fontSize: '14px' }}
                                        />
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                )}
            </Grid>
        </Grid>
    );
};

export { CreateRule, createRuleSchema };
