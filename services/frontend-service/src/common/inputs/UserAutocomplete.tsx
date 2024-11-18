import { Autocomplete, AutocompleteProps, TextField } from '@mui/material';
import i18next from 'i18next';
import _debounce from 'lodash.debounce';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { IUser } from '@microservices/shared';
import { searchExternalUsersRequest, searchUsersRequest } from '../../services/userService';
import { useWorkspaceStore } from '../../stores/workspace';
import { MeltaTooltip } from '../MeltaTooltip';

interface IUserAutocomplete<TMode = 'internal' | 'external'> {
    mode: TMode;
    value: IUser | null;
    displayValue?: string;
    onChange: AutocompleteProps<IUser, undefined, undefined, undefined>['onChange'];
    onDisplayValueChange?: AutocompleteProps<IUser, undefined, undefined, undefined>['onInputChange'];
    onBlur?: AutocompleteProps<IUser, undefined, undefined, undefined>['onBlur'];
    isOptionDisabled?: AutocompleteProps<IUser, undefined, undefined, undefined>['getOptionDisabled'];
    disabled?: boolean;
    readOnly?: boolean;
    label?: string;
    isError: boolean;
    helperText?: string;
    minInputLengthToSearch?: number;
    size?: 'small' | 'medium';
}

const UserAutocomplete: React.FC<IUserAutocomplete> = ({
    mode,
    value,
    displayValue,
    onChange,
    onDisplayValueChange,
    onBlur,
    isOptionDisabled,
    disabled = false,
    readOnly = false,
    label = i18next.t('userAutocomplete.label'),
    isError,
    helperText,
    minInputLengthToSearch = 2,
    size,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
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
            return searchUsersRequest({ search: currentDisplayValue || undefined, limit: 10 }).then((baseUsers) => baseUsers.users);
        },
        {
            onError: () => {
                toast.error(i18next.t('userAutocomplete.failedToSearchUsers'));
            },
            enabled: false,
            retry: false,
            initialData: [],
        },
    );

    const searchUsersOptionsDebounced = _debounce(searchUsersOptions, 1000);

    return (
        <MeltaTooltip title={value?.displayName ?? ''} sx={{ maxWidth: 'none' }}>
            <Autocomplete
                value={value}
                inputValue={currentDisplayValue}
                onChange={(_e, newValue, reason) => {
                    if (newValue) {
                        setInputValue(newValue.displayName);
                        onChange?.(_e, newValue, reason);
                    }
                }}
                onInputChange={(_e, newValue, reason) => {
                    setInputValue(newValue);
                    onDisplayValueChange?.(_e, newValue, reason);
                    if (reason === 'input' && newValue.length >= minInputLengthToSearch) {
                        searchUsersOptionsDebounced();
                    }
                }}
                disabled={disabled}
                onBlur={onBlur}
                filterOptions={(o) => o} // the "autoComplete" is done at server side
                getOptionLabel={({ displayName }) => displayName}
                getOptionDisabled={isOptionDisabled}
                isOptionEqualToValue={(option, currValue) => option._id === currValue._id}
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
                        error={isError}
                        fullWidth
                        helperText={helperText}
                        label={label}
                        InputProps={{ ...params.InputProps, readOnly, endAdornment: (readOnly || disabled) && undefined }}
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
                        sx={
                            readOnly
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
                                : {}
                        }
                    />
                )}
                readOnly={readOnly}
                size={size}
            />
        </MeltaTooltip>
    );
};

export default UserAutocomplete;
