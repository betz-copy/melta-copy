import React from 'react';
import { Popup } from 'react-leaflet';
import { Grid, Typography } from '@mui/material';

interface MapPopupProps {
    value: string;
    header: string;
    darkMode: boolean;
}

const updatePopupCss = (color: string) => {
    const popupElements = document.querySelectorAll('.leaflet-popup-content-wrapper, .leaflet-popup-tip');

    popupElements.forEach((element) => {
        if (element instanceof HTMLElement) {
            // eslint-disable-next-line no-param-reassign
            element.style.backgroundColor = color;
        }
    });
};

const EntityLocationPopup = ({ header, value, darkMode }: MapPopupProps) => {
    return (
        <Popup
            onOpen={() => {
                updatePopupCss(darkMode ? 'black' : 'white');
            }}
        >
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography variant="h6" color="textPrimary" fontWeight="bold">
                    {header}
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography color="textSecondary" fontSize="15px">
                    {value}
                </Typography>
            </Grid>
        </Popup>
    );
};

export default EntityLocationPopup;
