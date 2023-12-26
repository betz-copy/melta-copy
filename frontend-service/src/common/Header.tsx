import React from 'react';
import { Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { BlueTitle } from './BlueTitle';
import { RootState } from '../store';

const Header: React.FC<{ title: string }> = ({ title, children }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Grid
            item
            container
            justifyContent="space-between"
            alignItems="center"
            marginBottom="2%"
            style={{ height: '9vh', borderBottom: `1px solid ${darkMode ? '#3d3d42' : '#00000027'}` }}
        >
            <Grid item>
                <BlueTitle title={title} component="h4" variant="h4" />
            </Grid>
            <Grid item display="flex">
                {children}
            </Grid>
        </Grid>
    );
};

export { Header };
