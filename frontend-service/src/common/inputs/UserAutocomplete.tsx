import { Autocomplete, AutocompleteProps, SxProps, TextField, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import _debounce from 'lodash.debounce';
import i18next from 'i18next';
import { IUser, searchUsersRequest } from '../../services/kartoffelService';

const UserAutocomplete: React.FC<{
    value: IUser | null;
    onChange: AutocompleteProps<IUser, undefined, undefined, undefined>['onChange'];
    onBlur?: AutocompleteProps<IUser, undefined, undefined, undefined>['onBlur'];
    disabled?: boolean;
    readOnly?: boolean;
    isError: boolean;
    helperText?: string;
    minInputLengthToSearch?: number;
}> = ({ value, onChange, onBlur, disabled = false, readOnly = false, isError, helperText, minInputLengthToSearch = 2 }) => {
    const [inputValue, setInputValue] = useState<string>(value ? value.displayName : '');
    const {
        data: usersOptions,
        refetch: searchUsersOptions,
        isFetching: isFetchingUsersOptions,
    } = useQuery(['searchUsers', inputValue], () => searchUsersRequest(inputValue), {
        onError: (error) => {
            console.log('failed to search users. error:', error);
            toast.error(i18next.t('userAutocomplete.failedToSearchUsers'));
        },
        enabled: false,
        retry: false,
        initialData: [],
    });
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
        <Tooltip title={value?.displayName || ''} placement="top" sx={{ maxWidth: 'none' }}>
            <Autocomplete
                value={value}
                inputValue={inputValue}
                onChange={onChange}
                onInputChange={(_e, newValue, reason) => {
                    setInputValue(newValue);
                    if (reason === 'input' && newValue.length >= minInputLengthToSearch) {
                        searchUsersOptionsDebounced();
                    }
                }}
                disabled={disabled}
                onBlur={onBlur}
                filterOptions={(o) => o} // the "autoComplete" is done at server side
                getOptionLabel={(option) => option.displayName}
                isOptionEqualToValue={(option, currValue) => option.id === currValue.id}
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
                        label={i18next.t('userAutocomplete.label')}
                        InputProps={{ ...params.InputProps, readOnly, endAdornment: (readOnly || disabled) && undefined }}
                        InputLabelProps={{ ...(params.InputLabelProps, readOnly && readOnlyInputLabelProps) }}
                        sx={readOnly ? readOnlyValueSx : {}}
                    />
                )}
                readOnly={readOnly}
            />
        </Tooltip>
    );
};

export default UserAutocomplete;
