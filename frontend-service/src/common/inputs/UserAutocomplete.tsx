import { Autocomplete, AutocompleteProps, SxProps, TextField } from '@mui/material';
import i18next from 'i18next';
import _debounce from 'lodash.debounce';
import React, { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import { IExternalUser, IUser } from '../../interfaces/users';
import { searchExternalUsersRequest, searchUsersRequest } from '../../services/userService';
import { MeltaTooltip } from '../MeltaTooltip';

interface IUserAutocomplete<TMode = 'internal' | 'external', TUser = TMode extends 'internal' ? IUser : IExternalUser> {
    mode: TMode;
    value: TUser | null;
    displayValue?: string;
    onChange: AutocompleteProps<TUser, undefined, undefined, undefined>['onChange'];
    onDisplayValueChange?: AutocompleteProps<TUser, undefined, undefined, undefined>['onInputChange'];
    onBlur?: AutocompleteProps<TUser, undefined, undefined, undefined>['onBlur'];
    isOptionDisabled?: AutocompleteProps<TUser, undefined, undefined, undefined>['getOptionDisabled'];
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
    const user = useMemo(() => (mode === 'internal' ? value : Object.values((value as IExternalUser)?.digitalIdentities ?? {})[0]), [mode, value]);

    const [internalDisplayValue, setInputValue] = useState<string>(user ? user.displayName : '');

    const currentDisplayValue = displayValue ?? internalDisplayValue;

    const {
        data: usersOptions,
        refetch: searchUsersOptions,
        isFetching: isFetchingUsersOptions,
    } = useQuery(
        ['searchUsers', mode, currentDisplayValue],
        () => {
            if (mode === 'external') return searchExternalUsersRequest(currentDisplayValue);
            return searchUsersRequest({ search: currentDisplayValue, limit: 10 });
        },
        {
            onError: (error) => {
                console.log('failed to search users. error:', error);
                toast.error(i18next.t('userAutocomplete.failedToSearchUsers'));
            },
            enabled: false,
            retry: false,
            initialData: [] as IUser[] | IExternalUser[],
        },
    );

    const searchUsersOptionsDebounced = _debounce(searchUsersOptions, 1000);
    const readOnlyInputLabelProps: SxProps = {
        sx: {
            '&.Mui-focused': {
                color: 'rgba(0, 0, 0, 0.6)',
            },
        },
    };
    const readOnlyValueSx: SxProps = {
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
    };
    return (
        <MeltaTooltip title={value?.displayName || ''} sx={{ maxWidth: 'none' }}>
            <Autocomplete
                value={value}
                inputValue={currentDisplayValue}
                onChange={onChange}
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
                getOptionLabel={(option) => {
                    if (mode === 'external') return getDisplayNameFromExternalUser(option);
                    return option.displayName;
                }}
                getOptionDisabled={isOptionDisabled}
                isOptionEqualToValue={(option, currValue) => {
                    if (mode === 'external') return option.kartoffelId === currValue.kartoffelId;
                    return option._id === currValue._id;
                }}
                options={usersOptions!}
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
                        InputLabelProps={{ ...(params.InputLabelProps, readOnly && readOnlyInputLabelProps) }}
                        sx={readOnly ? readOnlyValueSx : {}}
                    />
                )}
                readOnly={readOnly}
                size={size}
            />
        </MeltaTooltip>
    );
};

export default UserAutocomplete;
