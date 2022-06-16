import React, { ReactNode } from 'react';
import { InputAdornment, TextField } from '@mui/material';
import i18next from 'i18next';

const SearchInput: React.FC<{
    value?: string;
    onChange: (newSearchValue: string) => void;
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
    endAdornmentChildren: ReactNode;
}> = ({ value, onChange, onKeyDown, endAdornmentChildren }) => {
    return (
        <TextField
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={i18next.t('searchLabel')}
            variant="outlined"
            fullWidth
            size="small"
            InputProps={{
                endAdornment: <InputAdornment position="end">{endAdornmentChildren}</InputAdornment>,
                sx: {
                    borderRadius: '40px',
                    backgroundColor: 'white',
                    paddingLeft: '15px',
                },
            }}
        />
    );
};

export default SearchInput;
