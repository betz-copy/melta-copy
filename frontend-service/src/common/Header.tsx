import { Grid } from '@mui/material';
import React, { ReactNode } from 'react';
import { useDarkModeStore } from '../stores/darkMode';
import BlueTitle from './MeltaDesigns/BlueTitle';

const Header: React.FC<{ title: string; children?: ReactNode }> = ({ title, children }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            marginBottom="2%"
            style={{ height: '9vh', borderBottom: `1px solid ${darkMode ? '#3d3d42' : '#00000027'}` }}
        >
            <Grid>
                <BlueTitle title={title} component="h4" variant="h4" />
            </Grid>
            <Grid display="flex">{children}</Grid>
        </Grid>
    );
};

export { Header };
