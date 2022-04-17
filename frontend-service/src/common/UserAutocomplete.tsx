import { Autocomplete, AutocompleteProps, TextField } from '@mui/material';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import _debounce from 'lodash.debounce';
import i18next from 'i18next';
import { IUser, searchUsersRequest } from '../services/kartoffelService';

const UserAutocomplete: React.FC<{
    value: IUser | null;
    onChange: AutocompleteProps<IUser, undefined, undefined, undefined>['onChange'];
    onBlur?: AutocompleteProps<IUser, undefined, undefined, undefined>['onBlur'];
    disabled: boolean;
    isError: boolean;
    helperText?: string;
    minInputLengthToSearch?: number;
}> = ({ value, onChange, onBlur, disabled, isError, helperText, minInputLengthToSearch = 2 }) => {
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

    return (
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
                    name="user"
                    variant="outlined"
                    label={i18next.t('userAutocomplete.label')}
                />
            )}
        />
    );
};

export default UserAutocomplete;
