import React, { useCallback, useState, CSSProperties } from 'react';
import { Box, Grid, IconButton, Pagination, TextField } from '@mui/material';
import { CloseOutlined as DeleteIcon } from '@mui/icons-material';
import i18next from 'i18next';
import _debounce from 'lodash.debounce';
import { useSelector } from 'react-redux';
import * as muiIcons from '../../utils/icons';
import { RootState } from '../../store';
import '../../css/index.css';

interface IconPickerProps {
    width: CSSProperties['width'];
    height: CSSProperties['height'];
    iconsPerPage: number;
    selectedIconName?: string;
    color?: CSSProperties['color'];
    onPick: (icon: File) => void;
    onDelete: () => void;
}

const iconsEntries = Object.entries(muiIcons);

const IconPicker: React.FC<IconPickerProps> = ({ width, height, iconsPerPage, selectedIconName, color, onPick, onDelete }) => {
    const [searchStr, setSearchStr] = useState('');
    const [page, setPage] = useState(1);

    const [displayedIcons, setDisplayedIcons] = useState([...iconsEntries]);

    const darkMode = useSelector((state: RootState) => state.darkMode);

    const displayIndex = (page - 1) * iconsPerPage;
    const pageCount = Math.ceil(displayedIcons.length / iconsPerPage);

    const borderColor = `rgb(211, 211, 211, ${darkMode ? 0.4 : 1})`;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const searchDebounced = useCallback(
        _debounce((str: string) => {
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
            <Grid container flexWrap="nowrap" justifyContent="space-between" alignItems="center">
                <TextField
                    placeholder={i18next.t('input.imagePicker.iconSearch')}
                    value={searchStr}
                    onChange={handleTextChange}
                    color={darkMode ? 'primary' : 'secondary'}
                    sx={{ flexGrow: 1 }}
                />

                <Grid
                    item
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

                            {React.createElement(muiIcons[selectedIconName], { fontSize: 'large', sx: { color } })}
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
                <Grid item container justifyContent="center">
                    {displayedIcons.slice(displayIndex, displayIndex + iconsPerPage).map(([name, icon]) => (
                        <IconButton key={name} value={name} onClick={handleIconClick}>
                            {React.createElement(icon, { sx: { color: color || darkMode ? 'white' : 'black' } })}
                        </IconButton>
                    ))}
                </Grid>
            </Box>
            <Pagination count={pageCount} page={page} onChange={(_event, newPage) => setPage(newPage)} />
        </Grid>
    );
};

export default IconPicker;
