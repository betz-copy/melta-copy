import { Autocomplete, AutocompleteProps, TextField } from '@mui/material';
import i18next from 'i18next';
import _debounce from 'lodash.debounce';
import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { searchRolesRequest } from '../../services/userService';
import { MeltaTooltip } from '../MeltaTooltip';
import { IRole } from '../../interfaces/roles';

export interface IRoleAutocomplete {
    roleId?: string;
    displayValue?: string;
    onChange: AutocompleteProps<IRole, undefined, undefined, undefined>['onChange'];
    onDisplayValueChange?: AutocompleteProps<IRole, undefined, undefined, undefined>['onInputChange'];
    onBlur?: any;
    onFocus?: any;
    isOptionDisabled?: AutocompleteProps<IRole, undefined, undefined, undefined>['getOptionDisabled'];
    disabled?: boolean;
    readOnly?: boolean;
    label?: string;
    isError: boolean;
    helperText?: string;
    minInputLengthToSearch?: number;
    size?: 'small' | 'medium';
    enableClear?: boolean;
    required?: boolean;
    autoFocus?: any;
    textFieldProps?: any;
    overrideSx?: Object;
}

const RoleAutocomplete: React.FC<IRoleAutocomplete> = ({
    roleId,
    displayValue,
    onChange,
    onDisplayValueChange,
    onBlur,
    onFocus,
    isOptionDisabled,
    disabled = false,
    readOnly = false,
    label = i18next.t('roleAutocomplete.label'),
    isError,
    helperText,
    minInputLengthToSearch = 2,
    size,
    enableClear = false,
    required,
    autoFocus,
    textFieldProps,
    overrideSx,
}) => {
    const [internalDisplayValue, setInputValue] = useState<string | undefined>(roleId);

    const currentDisplayValue = displayValue ?? internalDisplayValue;

    const {
        data: rolesOptions,
        refetch: searchRolesOptions,
        isFetching: isFetchingRolesOptions,
    } = useQuery(
        ['searchRoles', currentDisplayValue],
        () => {
            return searchRolesRequest({ search: currentDisplayValue || undefined, limit: 10 }).then((baseRoles) => baseRoles.roles);
        },
        {
            onError: () => {
                toast.error(i18next.t('roleAutocomplete.failedToSearchRoles'));
            },
            enabled: false,
            retry: false,
            initialData: [],
        },
    );

    const searchRolesOptionsDebounced = _debounce(searchRolesOptions, 1000);

    const value = useMemo(() => {
        if (!roleId || !Array.isArray(rolesOptions)) return null;
        return rolesOptions.find((role) => role._id === roleId) ?? null;
    }, [roleId, rolesOptions]);
    console.log({ value, roleId });

    return (
        <MeltaTooltip title={value?.name ?? ''} sx={{ maxWidth: 'none' }}>
            <Autocomplete
                value={value}
                inputValue={currentDisplayValue}
                onChange={(_e, newValue, reason) => {
                    setInputValue(newValue?.name);
                    onChange?.(_e, newValue, reason);
                }}
                onInputChange={(_e, newValue, reason) => {
                    setInputValue(newValue);
                    onDisplayValueChange?.(_e, newValue, reason);
                    if (reason === 'input' && newValue.length >= minInputLengthToSearch) {
                        searchRolesOptionsDebounced();
                    }
                }}
                disabled={disabled}
                filterOptions={(o) => o} // the "autoComplete" is done at server side
                getOptionLabel={({ name }) => name}
                getOptionDisabled={isOptionDisabled}
                isOptionEqualToValue={(option, currValue) => option._id === currValue?._id}
                options={
                    (rolesOptions?.sort((a, b) => {
                        if (!a.name) return 1;
                        if (!b.name) return -1;
                        return 0;
                    }) as IRole[]) ?? []
                }
                loading={isFetchingRolesOptions}
                loadingText={i18next.t('roleAutocomplete.loading')}
                noOptionsText={i18next.t('roleAutocomplete.noOptions')}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        {...textFieldProps}
                        autoFocus={autoFocus}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        error={isError}
                        fullWidth
                        helperText={helperText}
                        label={label}
                        InputProps={{
                            ...params.InputProps,
                            required,
                            readOnly,
                            endAdornment: enableClear ? params.InputProps.endAdornment : (readOnly || disabled) && undefined,
                        }}
                        InputLabelProps={{
                            ...(params.InputLabelProps,
                            readOnly && {
                                sx: {
                                    '&.Mui-focused': {
                                        color: 'rgba(0, 0, 0, 0.6)',
                                    },
                                },
                            }),
                        }}
                        sx={{
                            ...(readOnly
                                ? {
                                      '& .MuiOutlinedInput-root.Mui-focused': {
                                          '& > fieldset': {
                                              borderColor: 'rgba(0, 0, 0, 0.23)',
                                              borderWidth: '1px',
                                          },
                                      },
                                      '& .MuiOutlinedInput-root:hover': {
                                          '& > fieldset': {
                                              borderColor: 'rgba(0, 0, 0, 0.23)',
                                              borderWidth: '1px',
                                          },
                                      },
                                  }
                                : {}),
                            ...overrideSx,
                        }}
                    />
                )}
                readOnly={readOnly}
                size={size}
            />
        </MeltaTooltip>
    );
};

export default RoleAutocomplete;
