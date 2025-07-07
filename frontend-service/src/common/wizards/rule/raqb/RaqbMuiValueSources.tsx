import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import ExpandMoreSharpIcon from '@mui/icons-material/ExpandMoreSharp';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Check from '@mui/icons-material/Check';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { ValueSourcesProps } from '@react-awesome-query-builder/mui';

// copied file from raqb library. github.com/ukrbublik/react-awesome-query-builder/blob/d17da0103e90c96d3aa081304129b2b355b89c9a/packages/mui/modules/widgets/core/MuiValueSources.jsx
// added explicit "ltr". see below. in order to work in RTL mui enviorment, but speicifly keep the raqb in LTR
export default ({ valueSources, valueSrc, title, setValueSrc }: ValueSourcesProps) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const toggleOpenClose = (event) => {
        // eslint-disable-next-line no-unused-expressions
        anchorEl ? handleClose() : handleOpen(event);
    };

    const handleChange = (_e, srcKey) => {
        setValueSrc(srcKey);
        handleClose();
    };

    // eslint-disable-next-line @typescript-eslint/no-shadow
    const renderOptions = (valueSources) =>
        valueSources.map(([srcKey, info]) => {
            const isSelected = valueSrc === srcKey || (!valueSrc && srcKey === 'value');
            const onClick = (e) => handleChange(e, srcKey);
            return (
                <MenuItem key={srcKey} value={srcKey} selected={isSelected} onClick={onClick}>
                    {!isSelected && <ListItemText inset>{info.label}</ListItemText>}
                    {isSelected && (
                        <>
                            <ListItemIcon>
                                <Check />
                            </ListItemIcon>
                            {info.label}
                        </>
                    )}
                </MenuItem>
            );
        });

    const open = Boolean(anchorEl);

    return (
        <div>
            <IconButton size="small" onClick={toggleOpenClose}>
                <ExpandMoreSharpIcon />
            </IconButton>

            {/* added PaperProps={{ dir: 'ltr' }} */}
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose} PaperProps={{ dir: 'ltr' }}>
                <FormControl component="fieldset" sx={{ p: 0 }}>
                    <FormLabel component="legend" sx={{ p: 2, pt: 0, pb: 1 }}>
                        {title}
                    </FormLabel>
                    {renderOptions(valueSources)}
                </FormControl>
            </Menu>
        </div>
    );
};
