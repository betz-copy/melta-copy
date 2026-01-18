import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import { Box, Grid, IconButton, Pagination, TextField } from '@mui/material';
import i18next from 'i18next';
import { debounce } from 'lodash';
import React, { CSSProperties, useCallback, useState } from 'react';
import '../../css/index.css';
import { useDarkModeStore } from '../../stores/darkMode';
import { allIcons } from '../../utils/icons';

interface IconPickerProps {
    width: CSSProperties['width'];
    height: CSSProperties['height'];
    iconsPerPage: number;
    selectedIconName?: string;
    color?: CSSProperties['color'];
    onPick: (icon: File) => void;
    onDelete: () => void;
}

const iconsEntries = Object.entries(allIcons);

const IconPicker: React.FC<IconPickerProps> = ({ width, height, iconsPerPage, selectedIconName, color, onPick, onDelete }) => {
    const [searchStr, setSearchStr] = useState('');
    const [page, setPage] = useState(1);

    const [displayedIcons, setDisplayedIcons] = useState([...iconsEntries]);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const displayIndex = (page - 1) * iconsPerPage;
    const pageCount = Math.ceil(displayedIcons.length / iconsPerPage);

    const borderColor = `rgb(211, 211, 211, ${darkMode ? 0.4 : 1})`;

    const searchDebounced = useCallback(
        debounce((str: string) => {
            setPage(1);

            if (!str) {
                setDisplayedIcons([...iconsEntries]);
                return;
            }

            const filter = new RegExp(str, 'i');
            setDisplayedIcons(iconsEntries.filter(([name]) => filter.test(name)));
        }, 600),
        [],
    );

    const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { value } = event.target;

        setSearchStr(value);
        searchDebounced(value);
    };

    const handleIconClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        const svg = event.currentTarget.querySelector('svg');
        const iconName = `${event.currentTarget.value}.svg`;

        if (!svg) return;

        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        onPick(new File([svg.outerHTML], iconName, { type: 'image/svg+xml' }));
    };

    return (
        <Grid container justifyContent="center" direction="column" padding={1} width={width} height={height} alignItems="center" flexWrap="nowrap">
            <Grid container flexWrap="nowrap" justifyContent="space-between" alignItems="center" width="100%">
                <TextField
                    placeholder={i18next.t('input.imagePicker.iconSearch')}
                    value={searchStr}
                    onChange={handleTextChange}
                    sx={{ flexGrow: 1 }}
                />

                <Grid
                    container
                    justifyContent="space-around"
                    alignContent="center"
                    marginLeft="0.5rem"
                    width="3.5rem"
                    height="100%"
                    border={1}
                    borderRadius={1}
                    borderColor={borderColor}
                    sx={{ position: 'relative' }}
                >
                    {selectedIconName && (
                        <>
                            <IconButton onClick={onDelete} sx={{ position: 'absolute', right: 0, top: 0, padding: 0 }}>
                                <DeleteIcon sx={{ fontSize: 15 }} />
                            </IconButton>

                            {React.createElement(allIcons[selectedIconName] as React.ComponentType<{ style?: React.CSSProperties }>, {
                                style: { fontSize: '2rem', color },
                            })}
                        </>
                    )}
                </Grid>
            </Grid>

            <Box
                padding={0.4}
                border={1}
                borderRadius={1}
                borderColor={borderColor}
                overflow="overlay"
                height="75%"
                width="100%"
                marginTop="0.8rem"
                marginBottom="0.4rem"
                sx={{ direction: 'rtl' }}
            >
                <Grid container justifyContent="center">
                    {displayedIcons.slice(displayIndex, displayIndex + iconsPerPage).map(([name, icon]) => (
                        <IconButton key={name} value={name} onClick={handleIconClick}>
                            {React.createElement(icon, { style: { color: color || darkMode ? 'white' : 'black', fontSize: '1.55rem' } })}
                        </IconButton>
                    ))}
                </Grid>
            </Box>
            <Pagination count={pageCount} page={page} onChange={(_event, newPage) => setPage(newPage)} />
        </Grid>
    );
};

export default IconPicker;
