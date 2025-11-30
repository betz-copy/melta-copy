import { Autocomplete, Divider, FormControl, FormControlLabel, FormHelperText, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { getIn } from 'formik';
import Handlebars from 'handlebars';
import i18next from 'i18next';
import { omit } from 'lodash';
import React from 'react';
import { useQueryClient } from 'react-query';
import * as Yup from 'yup';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { ActionOnFail } from '../../../interfaces/rules';
import { useUserStore } from '../../../stores/user';
import { getAllWritePermissionEntityTemplates } from '../../../utils/permissions/templatePermissions';
import { StepComponentProps } from '../index';
import { RuleWizardValues } from '.';
import { CreateRuleColorField, CreateRuleEmailNotification } from './CreateIndicatorRuleControls';

const validMailField = (value: string): boolean => {
    try {
        Handlebars.parse(value);
        return true;
    } catch {
        return false;
    }
};

const mailSchema = Yup.object({
    display: Yup.boolean(),
    title: Yup.string()
        .when('display', {
            is: true,
            then: (schema) => schema.required(i18next.t('validation.required')),
        })
        .test('invalid-format', i18next.t('wizard.rule.invalidMailFormat'), function (this, value) {
            return !this.parent.display || validMailField(value ?? '');
        }),
    body: Yup.string()
        .when('display', {
            is: true,
            then: (schema) => schema.required(i18next.t('validation.required')),
        })
        .test('invalid-format', i18next.t('wizard.rule.invalidMailFormat'), function (this, value) {
            return !this.parent.display || validMailField(value ?? '');
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
}).test('at-least-one-indicator-config', i18next.t('wizard.rule.mustSelectOneIndicatorConfig'), function (values) {
    if (values.actionOnFail !== ActionOnFail.INDICATOR) return true;

    if (values.fieldColor?.display === true || values.mail?.display === true) return true;

    return this.createError({
        path: 'indicatorMustChooseOne',
        message: i18next.t('wizard.rule.mustSelectOneIndicatorConfig'),
    });
});

const hasUserFields = (entityTemplate: IMongoEntityTemplatePopulated | null) => {
    if (!entityTemplate) return false;

    return Object.values(entityTemplate.properties.properties).some((value) => value.format === 'user' || value.items?.format === 'user');
};

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
            setValues((prevValues: RuleWizardValues) => omit(prevValues, ['fieldColor', 'mail']));
        }

        handleChange(event);
    };

    const hasCheckedOneIndicator = touched.actionOnFail && values.actionOnFail === ActionOnFail.INDICATOR && getIn(errors, 'indicatorMustChooseOne');

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
                                key={actionOnFail}
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
                        <FormHelperText sx={{ color: hasCheckedOneIndicator ? 'error' : '#9398C2', fontSize: '14px' }}>
                            {i18next.t('wizard.rule.atLeastOne')}
                        </FormHelperText>
                        <CreateRuleColorField
                            fieldColor={values.fieldColor}
                            touched={touched.fieldColor}
                            errors={errors.fieldColor}
                            templateKeys={templateKeys}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                        />
                        <Grid>
                            <Divider sx={{ color: '#CCCFE580' }} />
                        </Grid>
                        <CreateRuleEmailNotification
                            mail={values.mail}
                            touched={touched.mail}
                            errors={errors.mail}
                            hasUserFields={hasUserFields(entityTemplate)}
                            setFieldValue={setFieldValue}
                        />
                    </Grid>
                )}
            </Grid>
        </Grid>
    );
};

export { CreateRule, createRuleSchema };
