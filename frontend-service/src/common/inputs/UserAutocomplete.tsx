import { ExpandMore } from '@mui/icons-material';
import { Autocomplete, AutocompleteProps, Chip, TextField } from '@mui/material';
import i18next from 'i18next';
import _debounce from 'lodash.debounce';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { IUser } from '../../interfaces/users';
import { searchExternalUsersRequest, searchUsersRequest } from '../../services/userService';
import { useDarkModeStore } from '../../stores/darkMode';
import { useWorkspaceStore } from '../../stores/workspace';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import UserAvatar from '../UserAvatar';

export interface IUserAutocomplete<TMode = 'internal' | 'external' | 'kartoffel'> {
    mode: TMode;
    value: IUser | null;
    displayValue?: string;
    onChange: AutocompleteProps<IUser, undefined, undefined, undefined>['onChange'];
    onDisplayValueChange?: AutocompleteProps<IUser, undefined, undefined, undefined>['onInputChange'];
    onBlur?: any;
    onFocus?: any;
    isOptionDisabled?: AutocompleteProps<IUser, undefined, undefined, undefined>['getOptionDisabled'];
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

const UserAutocomplete: React.FC<IUserAutocomplete> = ({
    mode,
    value,
    displayValue,
    onChange,
    onDisplayValueChange,
    onBlur,
    onFocus,
    isOptionDisabled,
    disabled = false,
    readOnly = false,
    label = i18next.t('userAutocomplete.label'),
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
    const workspace = useWorkspaceStore((state) => state.workspace);
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [internalDisplayValue, setInputValue] = useState<string>(value?.displayName ?? '');

    const currentDisplayValue = displayValue ?? internalDisplayValue;

    const {
        data: usersOptions,
        refetch: searchUsersOptions,
        isFetching: isFetchingUsersOptions,
    } = useQuery(
        ['searchUsers', mode, currentDisplayValue],
        () => {
            if (mode === 'external') return searchExternalUsersRequest(currentDisplayValue, workspace._id);
            if (mode === 'kartoffel') return searchExternalUsersRequest(currentDisplayValue, workspace._id, true);
            return searchUsersRequest({ search: currentDisplayValue || undefined, limit: 10 }).then((baseUsers) => baseUsers.users);
        },
        {
            onError: () => toast.error(i18next.t('userAutocomplete.failedToSearchUsers')),
            enabled: false,
            retry: false,
            initialData: [],
        },
    );

    const searchUsersOptionsDebounced = _debounce(searchUsersOptions, 1000);
    const isValueExist = value && value.fullName != '';

    return (
        <MeltaTooltip title={value?.displayName ? '' : value?.fullName ?? ''} sx={{ maxWidth: 'none' }}>
            <Autocomplete
                value={value}
                inputValue={currentDisplayValue}
                onChange={(_e, newValue, reason) => {
                    if (newValue) setInputValue(newValue.displayName || newValue?.fullName);
                    onChange?.(_e, newValue, reason);
                }}
                popupIcon={<ExpandMore />}
                onInputChange={(_e, newValue, reason) => {
                    setInputValue(newValue);
                    onDisplayValueChange?.(_e, newValue, reason);
                    if (reason === 'input' && newValue.length >= minInputLengthToSearch) {
                        searchUsersOptionsDebounced();
                    }
                }}
                disabled={disabled}
                filterOptions={(o) => o} // the "autoComplete" is done at server side
                getOptionLabel={({ displayName, fullName }) => displayName || fullName}
                getOptionDisabled={isOptionDisabled}
                isOptionEqualToValue={(option, currValue) => option._id === currValue?._id}
                options={
                    (usersOptions?.sort((a, b) => {
                        if (!a.fullName || !a.jobTitle || !a.hierarchy || !a.mail) return 1;
                        if (!b.fullName || !b.jobTitle || !b.hierarchy || !b.mail) return -1;
                        return 0;
                    }) as IUser[]) ?? []
                }
                loading={isFetchingUsersOptions}
                loadingText={i18next.t('userAutocomplete.loading')}
                noOptionsText={i18next.t('userAutocomplete.noOptions')}
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
                        slotProps={{
                            input: {
                                ...params.InputProps,
                                required,
                                readOnly,
                                endAdornment: enableClear ? params.InputProps.endAdornment : (readOnly || disabled) && undefined,
                                startAdornment: isValueExist ? (
                                    <Chip
                                        avatar={<UserAvatar user={value} size={25} overrideSx={{ border: '1.3px solid #FF006B' }} />}
                                        label={value.fullName}
                                        sx={{ background: darkMode ? '#1E1F2B' : '#EBEFFA', color: darkMode ? '#D3D6E0' : '#53566E' }}
                                    />
                                ) : undefined,
                                inputProps: {
                                    ...params.inputProps,
                                    style: isValueExist ? { display: 'none' } : {},
                                },
                            },
                            inputLabel: {
                                ...(params.InputLabelProps,
                                readOnly && {
                                    sx: {
                                        '&.Mui-focused': {
                                            color: 'rgba(0, 0, 0, 0.6)',
                                        },
                                    },
                                }),
                            },
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

export default UserAutocomplete;
