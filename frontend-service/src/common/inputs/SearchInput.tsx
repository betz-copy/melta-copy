import React, { ReactNode } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import i18next from 'i18next';

const SearchInput: React.FC<{
    value?: string;
    onChange: (newSearchValue: string) => void;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    endAdornmentChildren: ReactNode;
    topBarBorderRadius?: string;
}> = ({ value, onChange, onKeyDown, endAdornmentChildren, topBarBorderRadius }) => {
    return (
        <TextField
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={i18next.t('searchLabel')}
            variant="outlined"
            fullWidth
            size="small"
            sx={{ marginRight: '2rem' }}
            InputProps={{
                endAdornment: <InputAdornment position="end">{endAdornmentChildren}</InputAdornment>,
                sx: {
                    borderRadius: topBarBorderRadius ?? '7px 7px 7px 7px',
                    backgroundColor: 'white',
                },
            }}
        />
    );
};

export default SearchInput;
