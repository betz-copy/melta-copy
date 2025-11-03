import { Grid, SvgIcon, useTheme } from '@mui/material';
import React from 'react';

const StrechableArrowRight: React.FC<{ height?: number }> = ({ height = 50 }) => {
    const theme = useTheme();

    return (
        <Grid container alignItems="center">
            <Grid flex={1} height={height / 2} sx={{ backgroundColor: 'primary.main' }} />
            <Grid flex={0} style={{ height }}>
                <SvgIcon
                    sx={{
                        fontSize: height,
                        'body[dir=rtl] &': { transform: 'scaleX(-1)' },
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={theme.palette.primary.main}>
                        <polygon points="0,0 24,12 0,24" />
                    </svg>
                </SvgIcon>
            </Grid>
        </Grid>
    );
};

export default StrechableArrowRight;
