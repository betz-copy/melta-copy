import React from 'react';
import { TextField, Grid, RadioGroup, Radio, FormControl, FormControlLabel, FormLabel, FormHelperText, Autocomplete } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { StepComponentProps } from '../index';
import { RuleWizardValues } from '.';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { getAllWritePermissionEntityTemplates } from '../../../utils/permissions/templatePermissions';
import { useUserStore } from '../../../stores/user';

const createRuleSchema = {
    name: Yup.string().required(i18next.t('validation.required')),
    description: Yup.string().required(i18next.t('validation.required')),
    actionOnFail: Yup.string().oneOf(['WARNING', 'ENFORCEMENT']).required(i18next.t('validation.required')),
    entityTemplateId: Yup.string().required(i18next.t('validation.required')),
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

    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid>
                <TextField
                    name="name"
                    label={i18next.t('wizard.rule.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Grid>
            <Grid>
                <TextField
                    name="description"
                    label={i18next.t('wizard.rule.description')}
                    value={values.description}
                    onChange={handleChange}
                    error={touched.description && Boolean(errors.description)}
                    helperText={touched.description && errors.description}
                    multiline
                />
            </Grid>
            <Grid>
                <FormControl disabled={isEditMode}>
                    <FormLabel error={touched.actionOnFail && Boolean(errors.actionOnFail)}>{i18next.t('wizard.rule.actionOnFail')}</FormLabel>
                    <RadioGroup row name="actionOnFail" onChange={handleChange} value={values.actionOnFail}>
                        <FormControlLabel value="WARNING" control={<Radio />} label={i18next.t('wizard.rule.actions.warning')} />
                        <FormControlLabel value="ENFORCEMENT" control={<Radio />} label={i18next.t('wizard.rule.actions.enforcement')} />
                    </RadioGroup>
                    <FormHelperText>{touched.actionOnFail && errors.actionOnFail}</FormHelperText>
                </FormControl>
            </Grid>
            <Grid width="250px">
                <Autocomplete
                    options={allowedEntityTemplates}
                    onChange={(_e, value) => setFieldValue('entityTemplateId', value?._id || '')}
                    value={entityTemplate}
                    getOptionLabel={(option) => option.displayName}
                    onBlur={() => setFieldTouched('entityTemplateId')}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            fullWidth
                            error={Boolean(touched.entityTemplateId && errors.entityTemplateId)}
                            helperText={touched.entityTemplateId ? errors.entityTemplateId : ''}
                            variant="outlined"
                            label={i18next.t('wizard.rule.primaryEntityTemplate')}
                        />
                    )}
                />
            </Grid>
        </Grid>
    );
};

export { CreateRule, createRuleSchema };
