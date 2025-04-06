import { Autocomplete, Grid, MenuItem, TextField } from '@mui/material';
import React, { useState } from 'react';
import { FormikErrors, FormikTouched } from 'formik';
import i18next from 'i18next';
import { CommonFormInputProperties, IRelationshipReference } from './commonInterfaces';

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
    const errorExpandedUserField = errors?.expandedUserField as FormikErrors<IRelationshipReference> | undefined; // TODO: lir -  change type

    // TODO: lir - remove expandedUserField
    // TODO: block the option to select the same kartoffel field to the same user field
    // TODO: lir - support delete user field
    const [selectedUserField, setSelectedUserField] = useState<string | undefined>(value.expandedUserField?.relatedUserField);
    console.log({ userPropertiesInTemplate });

    return (
        <Grid item container justifyContent="space-between" flexWrap="nowrap" width="100%">
            <Autocomplete
                id={relatedUserField}
                options={userPropertiesInTemplate}
                onChange={(_e, userField) => {
                    setSelectedUserField(userField || undefined);
                    setFieldValue('expandedUserField', { relatedUserField: userField });
                }}
                sx={{ marginRight: '5px', width: '50%' }}
                value={selectedUserField}
                disabled={isDisabled}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        size="small"
                        error={touchedExpandedUserField && Boolean(errorExpandedUserField?.relatedTemplateId)}
                        fullWidth
                        sx={{
                            '& .MuiInputBase-root': {
                                borderRadius: '10px',
                            },
                        }}
                        helperText={touchedExpandedUserField && errorExpandedUserField?.relatedTemplateId}
                        name="template"
                        variant="outlined"
                        label={i18next.t('wizard.entityTemplate.relatedUser')}
                    />
                )}
            />
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
                error={touchedExpandedUserField && Boolean(errorExpandedUserField?.relationshipTemplateDirection)}
                helperText={errorExpandedUserField?.relationshipTemplateDirection}
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
        </Grid>
    );
};

export default KartoffelUserField;
