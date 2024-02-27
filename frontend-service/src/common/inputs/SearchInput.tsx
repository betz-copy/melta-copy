import React, { ReactNode } from 'react';
import { BaseTextFieldProps, Box, Divider, InputAdornment, TextField, useTheme } from '@mui/material';
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
}> = ({
    value,
    onChange,
    onKeyDown,
    endAdornmentChildren = (
        <img
            color="#1E2775"
            width="14px"
            height="14px"
            style={{
                marginRight: '8px',
                marginLeft: '8px',
            }}
            src="/icons/search-blue.svg"
        />
    ),
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
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
            size={size}
            sx={{ borderRadius, backgroundColor: toTopBar ? '#EBEFFA' : '#FFFFFF', height, padding: '0px, 8px, 0px, 8px', gap: '5px' }}
            InputProps={{
                endAdornment: (
                    <InputAdornment
                        position="end"
                        style={{
                            color: '#787C9E',
                            fontFamily: 'Rubik',
                            fontSize: '12px',
                            fontWeight: '400',
                            lineHeight: '16px',
                            letterSpacing: '0em',
                            textAlign: 'right',
                            height: '16px',
                            padding: '0px, 10px, 0px, 0px',
                            gap: '10px',
                            font: 'webkit-control',
                        }}
                    >
                        <Divider
                            orientation="vertical"
                            style={{
                                width: '1px',
                                height: '22px',
                                borderRadius: '1.5px',
                                backgroundColor: theme.palette.primary.main,
                                marginLeft: '7px',
                            }}
                        />

                        <Box
                            sx={{
                                width: '30px',
                                height: '28px',
                                borderRadius: '10px',
                                display: 'flex',
                                justifyItems: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {endAdornmentChildren}
                        </Box>
                    </InputAdornment>
                ),
                startAdornment: <InputAdornment position="start" />,
                style: {
                    borderRadius,
                    color: theme.palette.primary.main,
                    height,
                    width,
                },
            }}
        />
    );
};

export default SearchInput;
