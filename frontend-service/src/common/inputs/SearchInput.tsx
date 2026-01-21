import { Close, Search } from '@mui/icons-material';
import { BaseTextFieldProps, Divider, IconButton, InputAdornment, TextField, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { ReactNode, useEffect, useState } from 'react';
import { useDarkModeStore } from '../../stores/darkMode';
import { SessionStorage } from '../../utils/sessionStorage';

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
    showBorder?: boolean;
    clearButton?: boolean;
}> = ({
    value,
    onChange,
    onKeyDown,
    endAdornmentChildren = <Search fontSize="small" />,
    placeholder = i18next.t('searchLabel'),
    size = 'small',
    borderRadius = '7px',
    toTopBar = false,
    height = '34px',
    width = '231px',
    showBorder = false,
    clearButton = false,
}) => {
    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const [search, setSearch] = useState(value || '');

    useEffect(() => {
        onChange(search);
    }, [search, onChange]);

    return (
        <TextField
            value={search}
            onChange={(e) => {
                setSearch(e.target.value);
                SessionStorage.clearTableState();
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
                height,
                width,
                ...(darkMode
                    ? {}
                    : {
                          backgroundColor: toTopBar ? '#EBEFFA' : '#FFFFFF',
                          '& .MuiOutlinedInput-notchedOutline': { border: showBorder ? '' : 'none' },
                      }),
            }}
            slotProps={{
                input: {
                    style: {
                        borderRadius,
                        color: theme.palette.primary.main,
                        fontFamily: 'Rubik',
                        fontSize: '12px',
                        textAlign: 'right',
                    },
                    endAdornment: (
                        <InputAdornment position="end" sx={{ gap: '6px' }}>
                            {clearButton && search && (
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setSearch('');
                                        SessionStorage.clearTableState();
                                    }}
                                    sx={{ p: 0.5 }}
                                >
                                    <Close fontSize="small" />
                                </IconButton>
                            )}

                            <Divider
                                orientation="vertical"
                                sx={{
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
                },
            }}
        />
    );
};

export default SearchInput;
