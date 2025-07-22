import { Autocomplete, Grid, MenuItem, TextField } from '@mui/material';
import React from 'react';
import { FormikErrors, FormikTouched } from 'formik';
import i18next from 'i18next';
import { CommonFormInputProperties } from './commonInterfaces';

export interface FieldEditCardProps {
    value: CommonFormInputProperties;
    index: number;
    touched?: FormikTouched<CommonFormInputProperties>;
    errors?: FormikErrors<CommonFormInputProperties>;
    setFieldValue: (field: keyof CommonFormInputProperties, value: any) => void;
    isDisabled?: boolean;
    userPropertiesInTemplate?: string[];
}

const KartoffelUserField: React.FC<FieldEditCardProps> = ({
    value,
    index,
    touched,
    errors,
    setFieldValue,
    isDisabled,
    userPropertiesInTemplate = [],
}) => {
    const kartoffelUserFields: string[] = [
        'displayName',
        'identityCard',
        'personalNumber',
        'employeeNumber',
        'employeeId',
        'organization',
        'serviceType',
        'firstName',
        'lastName',
        'birthDate',
        'dischargeDay',
        'enlistmentDay',
        'akaUnit',
        'rank',
        'mail',
        'jobTitle',
        'phone',
        'mobilePhone',
        'address',
        'fullClearance',
        'sex',
        'directGroup',
        'hierarchy',
    ];

    const relatedUserField = `properties[${index}].relatedUserField`;
    const kartoffelField = `properties[${index}].kartoffel`;
    const touchedExpandedUserField = touched?.expandedUserField;
    const errorExpandedUserField = errors?.expandedUserField as
        | FormikErrors<{
              relatedUserField: string;
              kartoffelField: string;
          }>
        | undefined;

    return (
        <Grid item container justifyContent="space-between" flexWrap="nowrap" width="100%">
            <Autocomplete
                id={relatedUserField}
                options={userPropertiesInTemplate}
                onChange={(_e, userField) => {
                    const newValue = { ...value.expandedUserField, relatedUserField: userField || undefined };
                    setFieldValue('expandedUserField', newValue);
                }}
                sx={{ marginRight: '5px', width: '50%' }}
                value={value.expandedUserField?.relatedUserField}
                disabled={isDisabled}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        size="small"
                        error={touchedExpandedUserField && Boolean(errorExpandedUserField?.relatedUserField)}
                        fullWidth
                        sx={{
                            '& .MuiInputBase-root': {
                                borderRadius: '10px',
                            },
                        }}
                        helperText={touchedExpandedUserField && errorExpandedUserField?.relatedUserField}
                        name="template"
                        variant="outlined"
                        label={i18next.t('wizard.entityTemplate.relatedUser')}
                    />
                )}
            />
            {value.expandedUserField?.relatedUserField && (
                <TextField
                    select
                    label={i18next.t('wizard.entityTemplate.fieldDisplay')}
                    id={kartoffelField}
                    name={kartoffelField}
                    value={value.expandedUserField?.kartoffelField}
                    onChange={(e) => {
                        const newValue = { ...value.expandedUserField, kartoffelField: e.target.value };
                        setFieldValue('expandedUserField', newValue);
                    }}
                    error={touchedExpandedUserField && Boolean(errorExpandedUserField?.kartoffelField)}
                    helperText={errorExpandedUserField?.kartoffelField && i18next.t('wizard.entityTemplate.kartoffelFieldRequired')}
                    sx={{ marginRight: '5px', width: '50%' }}
                    disabled={isDisabled}
                    fullWidth
                >
                    {kartoffelUserFields.map((userField) => (
                        <MenuItem key={userField} value={userField}>
                            {i18next.t(`wizard.entityTemplate.kartoffelUserFields.${userField}`)}
                        </MenuItem>
                    ))}
                </TextField>
            )}
        </Grid>
    );
};

export default KartoffelUserField;
