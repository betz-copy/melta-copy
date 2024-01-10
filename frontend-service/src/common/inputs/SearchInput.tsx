import React, { ReactNode } from 'react';
import { BaseTextFieldProps, InputAdornment, TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import i18next from 'i18next';

const SearchInput: React.FC<{
    value?: string;
    onChange: (newSearchValue: string) => void;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    endAdornmentChildren?: ReactNode;
    placeholder?: string;
    size?: BaseTextFieldProps['size'];
    borderRadius?: string;
    toTopBar?: boolean;
}> = ({
    value,
    onChange,
    onKeyDown,
    endAdornmentChildren = <SearchIcon />,
    placeholder = i18next.t('searchLabel'),
    size = 'small',
    borderRadius = '30px',
    toTopBar = false,
}) => {
    return (
        <TextField
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
            size={size}
            style={{ borderRadius, backgroundColor: toTopBar ? '#EBEFFA' : '' }}
            sx={{ borderRadius, backgroundColor: 'white' }}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end" style={{ color: '#1E2775' }}>
                        <div style={{ width: '1px', height: '22px', borderRadius: '1.5px', backgroundColor: '#1E2775', marginLeft: '7px' }} />
                        {endAdornmentChildren}
                    </InputAdornment>
                ),
                startAdornment: <InputAdornment position="start" />,
                style: {
                    borderRadius,
                    color: '#1E2775',
                },
            }}
        />
    );
};

export default SearchInput;
