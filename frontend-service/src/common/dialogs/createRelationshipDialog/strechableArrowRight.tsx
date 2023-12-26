import React from 'react';
import { Grid, SvgIcon } from '@mui/material';

const StrechableArrowRight: React.FC<{ height?: number }> = ({ height = 50 }) => {
    return (
        <Grid container alignItems="center">
            <Grid item flex={1} height={height / 2} sx={{ backgroundColor: 'primary.main' }} />
            <Grid item flex={0} style={{ height }}>
                <SvgIcon
                    color="primary"
                    sx={{
                        fontSize: height,
                        'body[dir=rtl] &': { transform: 'scaleX(-1)' },
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <polygon points="0,0 24,12 0,24" />
                    </svg>
                </SvgIcon>
            </Grid>
        </Grid>
    );
};

export default StrechableArrowRight;
