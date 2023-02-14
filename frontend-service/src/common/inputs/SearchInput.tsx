import React, { ReactNode } from 'react';
import { BaseTextFieldProps, InputAdornment, TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const SearchInput: React.FC<{
    value?: string;
    onChange: (newSearchValue: string) => void;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    endAdornmentChildren?: ReactNode;
    placeholder?: string;
    size?: BaseTextFieldProps['size'];
    borderRadius?: string;
}> = ({
    value,
    onChange,
    onKeyDown,
    endAdornmentChildren = <SearchIcon />,
    placeholder = i18next.t('searchLabel'),
    size = 'small',
    borderRadius = '7px 7px 7px 7px',
}) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <TextField
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
            size={size}
            sx={{ marginRight: '2rem' }}
            InputProps={{
                endAdornment: <InputAdornment position="end">{endAdornmentChildren}</InputAdornment>,
                sx: {
                    backgroundColor: darkMode ? '#242424' : 'white',
                    borderRadius,
                },
            }}
        />
    );
};

export default SearchInput;
