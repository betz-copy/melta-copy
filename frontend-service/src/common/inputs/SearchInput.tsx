import React, { ReactNode } from 'react';
import { BaseTextFieldProps, Divider, InputAdornment, TextField, useTheme } from '@mui/material';
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
    height?: string;
    width?: string;
    isGlobalSearch?: boolean;
}> = ({
    value,
    onChange,
    onKeyDown,
    endAdornmentChildren = <img color="#1E2775" width="14px" height="14px" src="/icons/search-blue.svg" />,
    placeholder = i18next.t('searchLabel'),
    size = 'small',
    borderRadius = '7px',
    toTopBar = false,
    height = '34px',
    width = '231px',
}) => {
    const theme = useTheme();

    return (
        <TextField
            value={value}
            onChange={(e) => {
                onChange(e.target.value);
                sessionStorage.clear();
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            fullWidth
            size={size}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignContent: 'center',
                borderRadius,
                backgroundColor: toTopBar ? '#EBEFFA' : '#FFFFFF',
                height,
                width,
                padding: '0px, 8px, 0px, 8px',
                '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                },
            }}
            InputProps={{
                style: {
                    borderRadius,
                    color: theme.palette.primary.main,
                    fontFamily: 'Rubik',
                    fontSize: '12px',
                    textAlign: 'right',
                },
                endAdornment: (
                    <InputAdornment
                        position="end"
                        sx={{
                            fontWeight: '400',
                            letterSpacing: '0em',
                            lineHeight: '16px',
                            gap: '10px',
                        }}
                    >
                        <Divider
                            orientation="vertical"
                            style={{
                                width: '1px',
                                height: '20px',
                                borderRadius: '1.5px',
                                backgroundColor: theme.palette.primary.main,
                            }}
                        />
                        {endAdornmentChildren}
                    </InputAdornment>
                ),
                startAdornment: <InputAdornment position="start" />,
            }}
        />
    );
};

export default SearchInput;
