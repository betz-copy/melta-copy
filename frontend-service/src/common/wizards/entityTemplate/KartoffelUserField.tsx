import { Autocomplete, Grid, MenuItem, TextField } from '@mui/material';
import React, { useState } from 'react';
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
    userPropertiesInTemplate?: string[]; // TODO: lir - make sure the users list is updating in realtime...
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
        'goalUserId',
        'employeeNumber',
        'employeeId',
        'organization',
        'serviceType',
        'firstName',
        'lastName',
        'akaUnit',
        'rank',
        'mail',
        'jobTitle',
        'phone',
        'mobilePhone',
        'address',
        'fullClearance',
        'sex',
        'birthDate',
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

    const [selectedUserField, setSelectedUserField] = useState<string | undefined>(value.expandedUserField?.relatedUserField);
    const [selectedKartoffelField, setSelectedKartoffelField] = useState<string | undefined>(value.expandedUserField?.kartoffelField);

    let relatedUserHelperText = '';
    if (touchedExpandedUserField && !selectedUserField) relatedUserHelperText = i18next.t('wizard.entityTemplate.relatedUserFieldRequired');
    if (touchedExpandedUserField && errorExpandedUserField?.relatedUserField)
        relatedUserHelperText = i18next.t(errorExpandedUserField?.relatedUserField);

    return (
        <Grid item container justifyContent="space-between" flexWrap="nowrap" width="100%">
            <Autocomplete
                id={relatedUserField}
                options={userPropertiesInTemplate}
                onChange={(_e, userField) => {
                    const newValue = { ...value.expandedUserField, relatedUserField: userField };
                    setSelectedUserField(userField || undefined);
                    setFieldValue('expandedUserField', newValue);
                }}
                sx={{ marginRight: '5px', width: '50%' }}
                value={selectedUserField}
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
                        helperText={relatedUserHelperText}
                        name="template"
                        variant="outlined"
                        label={i18next.t('wizard.entityTemplate.relatedUser')}
                    />
                )}
            />
            {selectedUserField && (
                <TextField
                    select
                    label={i18next.t('wizard.entityTemplate.fieldDisplay')}
                    id={kartoffelField}
                    name={kartoffelField}
                    value={selectedKartoffelField}
                    onChange={(e) => {
                        const newValue = { ...value.expandedUserField, kartoffelField: e.target.value };
                        setSelectedKartoffelField(e.target.value);
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
