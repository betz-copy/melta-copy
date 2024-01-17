import { Autocomplete, AutocompleteProps, SxProps, TextField } from '@mui/material';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import _debounce from 'lodash.debounce';
import i18next from 'i18next';
import { IUser, searchUsersRequest } from '../../services/kartoffelService';
import { MeltaTooltip } from '../MeltaTooltip';

const UserAutocomplete: React.FC<{
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
}> = ({
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
    const [internalDisplayValue, setInputValue] = useState<string>(value ? value.displayName : '');

    const currentDisplayValue = displayValue ?? internalDisplayValue;

    const {
        data: usersOptions,
        refetch: searchUsersOptions,
        isFetching: isFetchingUsersOptions,
    } = useQuery(['searchUsers', currentDisplayValue], () => searchUsersRequest(currentDisplayValue), {
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
                getOptionLabel={(option) => option.displayName}
                getOptionDisabled={isOptionDisabled}
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
