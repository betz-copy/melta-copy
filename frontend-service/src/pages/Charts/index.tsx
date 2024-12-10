import { Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import { ChartHeader } from './ChartHeader';

interface IChartsPageProps {
    setTitle: React.Dispatch<React.SetStateAction<string>>;
}

const ChartsPage: React.FC<IChartsPageProps> = ({ setTitle }) => {
    useEffect(() => setTitle(i18next.t('pages.charts')), [setTitle]);

    return (
        <Grid>
            <ChartHeader />
        </Grid>
    );
};

export default ChartsPage;
