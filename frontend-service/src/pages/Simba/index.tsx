/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Grid, Typography } from '@mui/material';

const SimbaPage: React.FC<{}> = ({}) => {
    return (
        <Grid container height="100%">
            <Grid item container flexDirection="column" height="100%" width="60%" sx={{ backgroundColor: '#F0F2F7' }}>
                <Grid item>
                    <Typography fontSize="24px" color="#1E2775" fontWeight="300">
                        לא מצאנו אותך ברשימת הנהגים שלנו
                    </Typography>
                    <Typography fontSize="40px" color="#1E2775" fontWeight="600">נראה כי אין ברשותך רישיון פעיל </Typography>
                </Grid>
            </Grid>
            <Grid item height="100%" width="40%" sx={{ backgroundColor: '#4752B6' }}>
                <img src="/icons/simba-logo.svg"></img>
            </Grid>
        </Grid>
    );
};

export default SimbaPage;
