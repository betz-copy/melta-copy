import React from 'react';
import { Search as SearchIcon } from '@mui/icons-material';
import { TextField, InputAdornment, Divider, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useDarkModeStore } from '../../stores/darkMode';

export const Search: React.FC<{ value: string; onChange: (value: string) => void; toTopBar?: boolean; templatesSelectGrid?: boolean }> = ({
    value,
    onChange,
    toTopBar,
    templatesSelectGrid,
}) => {
    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    // must wrap with TextField with Grid. no idea why, but it works :O
    return (
        <Grid container>
            <Grid
                size={{ xs: 12 }}
                width="199px"
                height="34px"
                style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', maxHeight: '34px' }}
            >
                <TextField
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key !== 'Escape') {
                            // prevents autoselecting item while typing (default Select behaviour)
                            e.stopPropagation();
                        }
                    }}
                    sx={{
                        ...(darkMode
                            ? {}
                            : {
                                  background: toTopBar || templatesSelectGrid ? '#FFFFFF' : '#EBEFFA',
                                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                              }),
                        boxShadow: templatesSelectGrid ? '-2px 2px 6px 0px #1E27754D' : '',
                        borderRadius: '7px',
                        width: '199px',
                        height: '34px',
                    }}
                    placeholder={i18next.t('searchLabel')}
                    fullWidth
                    InputProps={{
                        style: {
                            fontFamily: 'Rubik',
                            fontSize: '12px',
                            textAlign: 'right',
                            borderRadius: '7px',
                        },
                        endAdornment: (
                            <InputAdornment
                                position="end"
                                sx={{
                                    padding: '0px, 10px, 0px, 0px',
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
                                <SearchIcon sx={{ fontSize: '1.3rem', color: theme.palette.primary.main }} />
                            </InputAdornment>
                        ),
                        startAdornment: <InputAdornment position="start" />,
                    }}
                />
            </Grid>
        </Grid>
    );
};
