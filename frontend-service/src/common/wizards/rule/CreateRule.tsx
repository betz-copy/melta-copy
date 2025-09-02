import { Autocomplete, Divider, FormControl, FormControlLabel, FormHelperText, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import * as Yup from 'yup';
import { RuleWizardValues } from '.';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { ActionOnFail } from '../../../interfaces/rules';
import { useUserStore } from '../../../stores/user';
import { getAllWritePermissionEntityTemplates } from '../../../utils/permissions/templatePermissions';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { MinimizedColorPicker } from '../../inputs/MinimizedColorPicker';
import { StepComponentProps } from '../index';

const createRuleSchema = {
    name: Yup.string().required(i18next.t('validation.required')),
    description: Yup.string().required(i18next.t('validation.required')),
    actionOnFail: Yup.string()
        .oneOf([ActionOnFail.WARNING, ActionOnFail.ENFORCEMENT, ActionOnFail.INDICATOR])
        .required(i18next.t('validation.required')),
    entityTemplateId: Yup.string().required(i18next.t('validation.required')),
    fieldColor: Yup.object({
        field: Yup.string(),
        color: Yup.string(),
    })
        .nullable()
        .when('actionOnFail', {
            is: ActionOnFail.INDICATOR,
            then: (schema) => schema,
            otherwise: (schema) => schema.test('forbidden-fieldColor', i18next.t('validation.forbidden'), (value) => value == null),
        }), // TODO: after adding mail do required to one of them if it's INDICATOR
};

const CreateRule: React.FC<StepComponentProps<RuleWizardValues, 'isEditMode'>> = ({
    values,
    touched,
    errors,
    handleChange,
    setFieldValue,
    setFieldTouched,
    isEditMode,
}) => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const { entityTemplateId } = values;

    const activeEntityTemplatesFiltered = Array.from(entityTemplates.values()).filter(({ disabled }) => !disabled);
    const allowedEntityTemplates = getAllWritePermissionEntityTemplates(activeEntityTemplatesFiltered, currentUser);

    const entityTemplate = entityTemplateId ? entityTemplates.get(entityTemplateId)! : null;
    const templateKeys = Object.entries(entityTemplate?.properties.properties || {}).map(([key, { title }]) => ({ key, title }));

    const [fieldColor, setFieldColor] = useState<boolean>(values.actionOnFail === ActionOnFail.INDICATOR);

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
                />
            </Grid>
            <Grid>
                <FormControl disabled={isEditMode} sx={{ width: '100%' }}>
                    <RadioGroup row name="actionOnFail" onChange={handleChange} value={values.actionOnFail}>
                        <FormControlLabel value={ActionOnFail.WARNING} control={<Radio />} label={i18next.t('wizard.rule.actions.warning')} />
                        <FormControlLabel value={ActionOnFail.ENFORCEMENT} control={<Radio />} label={i18next.t('wizard.rule.actions.enforcement')} />
                        <FormControlLabel value={ActionOnFail.INDICATOR} control={<Radio />} label={i18next.t('wizard.rule.actions.indicator')} />
                    </RadioGroup>
                    <FormHelperText>{touched.actionOnFail && errors.actionOnFail}</FormHelperText>

                    {values.actionOnFail === ActionOnFail.INDICATOR && (
                        <Grid container direction="column" gap={2}>
                            <FormHelperText sx={{ color: '#9398C2', fontSize: '14px' }}>{i18next.t('wizard.rule.atLeastOne')}</FormHelperText>
                            <FormControlLabel
                                control={<MeltaCheckbox checked={fieldColor} onChange={(e) => setFieldColor(e.target.checked)} />}
                                label={i18next.t('wizard.rule.fieldColor')}
                                sx={{ display: 'flex', alignItems: 'center' }}
                            />
                            {!!fieldColor && (
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
                                                error={Boolean(touched.fieldColor && errors.fieldColor)}
                                                helperText={touched.fieldColor ? errors.fieldColor?.toString() : ''}
                                                variant="outlined"
                                                label={i18next.t('wizard.rule.fieldToColor')}
                                            />
                                        )}
                                    />
                                    <MinimizedColorPicker
                                        color={values.fieldColor?.color}
                                        onColorChange={(newColor) => setFieldValue('fieldColor.color', newColor)}
                                        circleSize="2rem"
                                    />
                                </Grid>
                            )}
                            <Grid>
                                <Divider sx={{ color: '#CCCFE580' }} />
                            </Grid>
                        </Grid>
                    )}
                </FormControl>
            </Grid>
        </Grid>
    );
};

export { CreateRule, createRuleSchema };
