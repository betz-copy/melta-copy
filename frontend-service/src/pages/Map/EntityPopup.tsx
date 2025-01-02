import React from 'react';
import { Popup } from 'react-leaflet';
import { Grid, Typography } from '@mui/material';

interface MapPopupProps {
    value: string;
    header: string;
    darkMode?: boolean;
}

const EntityPopup = ({ header, value }: MapPopupProps) => {
    return (
        <Popup keepInView>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography variant="h6" color="textPrimary" fontWeight="bold">
                    {header}
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Typography color="textSecondary">{value}</Typography>
            </Grid>
        </Popup>
    );
};

export default EntityPopup;
